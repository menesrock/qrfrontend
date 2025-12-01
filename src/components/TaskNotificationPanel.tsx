import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { TaskNotificationCard } from './TaskNotificationCard';
import { getSocket } from '../config/socket';
import { ordersService } from '../services/orders.service';
import { callRequestsService } from '../services/callRequests.service';
import { Order, CallRequest } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface TaskItem {
  id: string;
  type: 'order' | 'call';
  tableName: string;
  customerName: string;
  message: string;
  createdAt: string;
  claimedBy?: string | null;
  data: Order | CallRequest;
}

export const TaskNotificationPanel: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const loadTasks = useCallback(async () => {
    if (!user || user.role !== 'waiter') return;

    try {
      const [orders, calls] = await Promise.all([
        ordersService.getAll({ status: 'pending' }),
        callRequestsService.getAll({ status: 'pending' }),
      ]);

      const orderTasks: TaskItem[] = orders.map((order) => {
        const itemSummary = order.items
          .map((item) => `${item.menuItemName} x${item.quantity}`)
          .join(', ');
        return {
          id: order.id,
          type: 'order',
          tableName: order.tableName,
          customerName: order.customerName,
          message: `${itemSummary} istiyor`,
          createdAt: order.createdAt,
          claimedBy: order.claimedBy,
          data: order,
        };
      });

      const callTasks: TaskItem[] = calls.map((call) => {
        const typeMessages: Record<string, string> = {
          bill: 'hesap istiyor',
          napkin: 'peçete istiyor',
          cleaning: 'temizlik istiyor',
        };
        return {
          id: call.id,
          type: 'call',
          tableName: call.tableName,
          customerName: call.customerName,
          message: typeMessages[call.type] || 'bir şey istiyor',
          createdAt: call.createdAt,
          claimedBy: call.claimedBy,
          data: call,
        };
      });

      // Combine and sort by time (newest first - so newest at top)
      const allTasks = [...orderTasks, ...callTasks].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Filter: only show unclaimed tasks or tasks claimed by current user
      const visibleTasks = allTasks.filter(
        (task) => !task.claimedBy || task.claimedBy === user.id
      );

      setTasks(visibleTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, [user]);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  }, [loadTasks]);

  // Listen to socket events
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const handleNewOrder = () => {
      loadTasks();
    };

    const handleNewCall = () => {
      loadTasks();
    };

    const handleClaimed = () => {
      loadTasks();
    };

    const handleReleased = () => {
      loadTasks();
    };

    socket.on('order:new', handleNewOrder);
    socket.on('call:new', handleNewCall);
    socket.on('order:claimed', handleClaimed);
    socket.on('call:claimed', handleClaimed);
    socket.on('order:released', handleReleased);
    socket.on('call:released', handleReleased);

    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('call:new', handleNewCall);
      socket.off('order:claimed', handleClaimed);
      socket.off('call:claimed', handleClaimed);
      socket.off('order:released', handleReleased);
      socket.off('call:released', handleReleased);
    };
  }, [user, loadTasks]);

  const handleClaim = async (task: TaskItem) => {
    try {
      if (task.type === 'order') {
        await ordersService.claim(task.id);
      } else {
        await callRequestsService.claim(task.id);
      }
      loadTasks();
    } catch (error) {
      console.error('Failed to claim task:', error);
    }
  };

  const handleComplete = async (task: TaskItem) => {
    try {
      if (task.type === 'order') {
        await ordersService.updateStatus(task.id, 'confirmed');
      } else {
        await callRequestsService.complete(task.id);
      }
      // Remove from local list after completion
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleSkip = async (task: TaskItem) => {
    try {
      if (task.claimedBy === user?.id) {
        // Release if claimed by me - this makes it available to other waiters
        if (task.type === 'order') {
          await ordersService.release(task.id);
        } else {
          await callRequestsService.release(task.id);
        }
        // Remove from local list after release
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
      } else {
        // If not claimed, just remove from local list (doesn't affect other waiters)
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
      }
    } catch (error) {
      console.error('Failed to skip task:', error);
    }
  };

  const handleClose = (task: TaskItem) => {
    // Just remove from local list (doesn't affect other waiters)
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  };

  if (!user || user.role !== 'waiter' || tasks.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {tasks.map((task) => (
          <TaskNotificationCard
            key={task.id}
            id={task.id}
            type={task.type}
            tableName={task.tableName}
            customerName={task.customerName}
            message={task.message}
            createdAt={task.createdAt}
            claimedBy={task.claimedBy}
            currentUserId={user.id}
            onClaim={() => handleClaim(task)}
            onComplete={() => handleComplete(task)}
            onSkip={() => handleSkip(task)}
            onClose={() => handleClose(task)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '60%',
    zIndex: 1000,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 16,
    paddingTop: 8,
  },
});

