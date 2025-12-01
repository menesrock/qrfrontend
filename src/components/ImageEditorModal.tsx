import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Image, Platform, PanResponder, Animated } from 'react-native';
import { Modal, Portal, Text, Button, IconButton } from 'react-native-paper';
import { uploadService } from '../services';

interface ImageEditorModalProps {
  visible: boolean;
  imageUri: string | null;
  onDismiss: () => void;
  onSave: (imageUrl: string) => void;
}

const CROP_SIZE = 480; // 480x480px crop box

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  visible,
  imageUri,
  onDismiss,
  onSave,
}) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [cropBoxSize, setCropBoxSize] = useState(CROP_SIZE);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [isResizingCrop, setIsResizingCrop] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStartSize, setCropStartSize] = useState(CROP_SIZE);
  const [cropStartPosition, setCropStartPosition] = useState({ x: 0, y: 0 });

  const containerRef = useRef<View>(null);
  const imageRef = useRef<Image>(null);

  useEffect(() => {
    if (visible && imageUri) {
      // Reset values when modal opens
      setCropBoxSize(CROP_SIZE);
      setCropPosition({ x: 0, y: 0 });
      setImageScale(1);
      setImagePosition({ x: 0, y: 0 });
      
      // Get image dimensions
      Image.getSize(
        imageUri,
        (width, height) => {
          setImageSize({ width, height });
        },
        (error) => {
          console.error('Failed to get image size:', error);
        }
      );
    }
  }, [visible, imageUri]);

  // Calculate image display size to fit container
  useEffect(() => {
    if (containerSize.width > 0 && imageSize.width > 0) {
      const containerAspect = containerSize.width / containerSize.height;
      const imageAspect = imageSize.width / imageSize.height;
      
      let displayWidth = containerSize.width;
      let displayHeight = containerSize.height;
      
      if (imageAspect > containerAspect) {
        displayHeight = containerSize.width / imageAspect;
      } else {
        displayWidth = containerSize.height * imageAspect;
      }
      
      // Center image
      setImagePosition({
        x: (containerSize.width - displayWidth) / 2,
        y: (containerSize.height - displayHeight) / 2,
      });
    }
  }, [containerSize, imageSize]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      const { locationX, locationY } = evt.nativeEvent;
      const cropLeft = cropPosition.x;
      const cropTop = cropPosition.y;
      const cropRight = cropLeft + cropBoxSize;
      const cropBottom = cropTop + cropBoxSize;
      
      // Check if touch is on crop box corners (resize area)
      const resizeThreshold = 30;
      const isOnCorner = 
        (Math.abs(locationX - cropLeft) < resizeThreshold && Math.abs(locationY - cropTop) < resizeThreshold) ||
        (Math.abs(locationX - cropRight) < resizeThreshold && Math.abs(locationY - cropTop) < resizeThreshold) ||
        (Math.abs(locationX - cropLeft) < resizeThreshold && Math.abs(locationY - cropBottom) < resizeThreshold) ||
        (Math.abs(locationX - cropRight) < resizeThreshold && Math.abs(locationY - cropBottom) < resizeThreshold);
      
      // Check if touch is inside crop box (drag area)
      const isInsideCrop = 
        locationX >= cropLeft && locationX <= cropRight &&
        locationY >= cropTop && locationY <= cropBottom;
      
      if (isOnCorner) {
        setIsResizingCrop(true);
        setCropStartSize(cropBoxSize);
        setCropStartPosition({ x: locationX, y: locationY });
        return true;
      } else if (isInsideCrop) {
        setIsDraggingCrop(true);
        setDragStart({ x: locationX - cropPosition.x, y: locationY - cropPosition.y });
        return true;
      }
      return false;
    },
    onMoveShouldSetPanResponder: () => isDraggingCrop || isResizingCrop,
    onPanResponderGrant: () => {
      // Already handled in onStartShouldSetPanResponder
    },
    onPanResponderMove: (evt, gestureState) => {
      const { locationX, locationY } = evt.nativeEvent;
      
      if (isResizingCrop) {
        // Resize crop box from bottom-right corner
        const deltaX = locationX - cropStartPosition.x;
        const deltaY = locationY - cropStartPosition.y;
        const delta = Math.max(deltaX, deltaY);
        const newSize = Math.max(100, Math.min(Math.min(containerSize.width, containerSize.height), cropStartSize + delta));
        setCropBoxSize(newSize);
        
        // Keep crop box within bounds
        const maxX = containerSize.width - newSize;
        const maxY = containerSize.height - newSize;
        setCropPosition((prev) => ({
          x: Math.max(0, Math.min(maxX, prev.x)),
          y: Math.max(0, Math.min(maxY, prev.y)),
        }));
      } else if (isDraggingCrop) {
        // Move crop box
        const newX = Math.max(0, Math.min(containerSize.width - cropBoxSize, locationX - dragStart.x));
        const newY = Math.max(0, Math.min(containerSize.height - cropBoxSize, locationY - dragStart.y));
        setCropPosition({ x: newX, y: newY });
      }
    },
    onPanResponderRelease: () => {
      setIsDraggingCrop(false);
      setIsResizingCrop(false);
    },
  });

  const handleScaleChange = (delta: number) => {
    const newScale = Math.max(0.5, Math.min(3, imageScale + delta));
    setImageScale(newScale);
  };

  const handleSave = async () => {
    if (!imageUri) return;

    try {
      setUploading(true);
      
      // For web, use canvas to crop and resize
      if (Platform.OS === 'web') {
        const canvas = document.createElement('canvas');
        canvas.width = CROP_SIZE;
        canvas.height = CROP_SIZE;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Canvas context not available');
        }

        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            // Calculate the actual crop area in the original image
            // Crop box position relative to container
            const containerAspect = containerSize.width / containerSize.height;
            const imageAspect = imageSize.width / imageSize.height;
            
            let displayWidth = containerSize.width;
            let displayHeight = containerSize.height;
            
            if (imageAspect > containerAspect) {
              displayHeight = containerSize.width / imageAspect;
            } else {
              displayWidth = containerSize.height * imageAspect;
            }
            
            // Scale to account for imageScale
            const scaledDisplayWidth = displayWidth * imageScale;
            const scaledDisplayHeight = displayHeight * imageScale;
            
            // Calculate crop box position relative to scaled image
            const imageLeft = (containerSize.width - scaledDisplayWidth) / 2 + imagePosition.x;
            const imageTop = (containerSize.height - scaledDisplayHeight) / 2 + imagePosition.y;
            
            const cropBoxLeft = cropPosition.x - imageLeft;
            const cropBoxTop = cropPosition.y - imageTop;
            
            // Calculate source coordinates in original image
            const sourceX = (cropBoxLeft / scaledDisplayWidth) * imageSize.width;
            const sourceY = (cropBoxTop / scaledDisplayHeight) * imageSize.height;
            const sourceSize = (cropBoxSize / scaledDisplayWidth) * imageSize.width;
            
            // Draw cropped and resized image
            ctx.drawImage(
              img,
              Math.max(0, sourceX),
              Math.max(0, sourceY),
              Math.min(sourceSize, imageSize.width - sourceX),
              Math.min(sourceSize, imageSize.height - sourceY),
              0,
              0,
              CROP_SIZE,
              CROP_SIZE
            );
            resolve(null);
          };
          img.onerror = reject;
          img.src = imageUri;
        });

        // Convert canvas to blob and upload
        canvas.toBlob(async (blob) => {
          if (!blob) {
            console.error('Failed to create blob from canvas');
            setUploading(false);
            return;
          }

          try {
            const formData = new FormData();
            formData.append('image', blob, 'image.webp');

            console.log('Uploading image blob, size:', blob.size);
            const response = await uploadService.uploadImage(formData);
            console.log('Upload successful:', response);
            onSave(response.images.full);
            setUploading(false);
            onDismiss();
          } catch (error) {
            console.error('Failed to upload image:', error);
            setUploading(false);
            // Show error to user
            alert('Fotoğraf yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
          }
        }, 'image/webp', 0.85);
      } else {
        // For mobile, upload original and let backend handle resize
        try {
          const formData = new FormData();
          formData.append('image', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'image.jpg',
          } as any);

          const response = await uploadService.uploadImage(formData);
          onSave(response.images.full);
          setUploading(false);
          onDismiss();
        } catch (error) {
          console.error('Failed to upload image (mobile):', error);
          setUploading(false);
          alert('Fotoğraf yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
        }
      }
    } catch (error) {
      console.error('Failed to save image:', error);
      setUploading(false);
      alert('Fotoğraf işlenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  if (!imageUri) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Fotoğraf Düzenle
          </Text>
          <IconButton
            icon="close"
            size={24}
            onPress={onDismiss}
            iconColor="#000000"
          />
        </View>

        <View
          ref={containerRef}
          style={styles.imageContainer}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setContainerSize({ width, height });
          }}
          {...panResponder.panHandlers}
        >
          <View style={styles.imageWrapper}>
            <Image
              ref={imageRef}
              source={{ uri: imageUri }}
              style={[
                styles.image,
                {
                  transform: [
                    { translateX: imagePosition.x },
                    { translateY: imagePosition.y },
                    { scale: imageScale },
                  ],
                },
              ]}
              resizeMode="contain"
            />
          </View>
          
          {/* Crop Box */}
          <View
            style={[
              styles.cropBox,
              {
                left: cropPosition.x,
                top: cropPosition.y,
                width: cropBoxSize,
                height: cropBoxSize,
              },
            ]}
            pointerEvents="none"
          >
            <View style={styles.cropBoxBorder} />
            {/* Resize handles */}
            <View style={[styles.resizeHandle, styles.resizeHandleTopLeft]} />
            <View style={[styles.resizeHandle, styles.resizeHandleTopRight]} />
            <View style={[styles.resizeHandle, styles.resizeHandleBottomLeft]} />
            <View style={[styles.resizeHandle, styles.resizeHandleBottomRight]} />
          </View>
          
          {/* Overlay (darken outside crop area) */}
          <View style={styles.overlay} pointerEvents="none">
            {/* Top */}
            <View
              style={[
                styles.overlayPart,
                {
                  top: 0,
                  left: 0,
                  right: 0,
                  height: cropPosition.y,
                },
              ]}
            />
            {/* Bottom */}
            <View
              style={[
                styles.overlayPart,
                {
                  top: cropPosition.y + cropBoxSize,
                  left: 0,
                  right: 0,
                  bottom: 0,
                },
              ]}
            />
            {/* Left */}
            <View
              style={[
                styles.overlayPart,
                {
                  top: cropPosition.y,
                  left: 0,
                  width: cropPosition.x,
                  height: cropBoxSize,
                },
              ]}
            />
            {/* Right */}
            <View
              style={[
                styles.overlayPart,
                {
                  top: cropPosition.y,
                  left: cropPosition.x + cropBoxSize,
                  right: 0,
                  height: cropBoxSize,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.controls}>
          <Text variant="bodyMedium" style={styles.label}>
            Fotoğrafı Yakınlaştır/Uzaklaştır
          </Text>
          <View style={styles.sliderContainer}>
            <View style={styles.scaleButtons}>
              <Button
                mode="outlined"
                onPress={() => handleScaleChange(-0.1)}
                compact
                icon="minus"
              >
                Azalt
              </Button>
              <Text variant="bodyMedium" style={styles.scaleValue}>
                {Math.round(imageScale * 100)}%
              </Text>
              <Button
                mode="outlined"
                onPress={() => handleScaleChange(0.1)}
                compact
                icon="plus"
              >
                Artır
              </Button>
            </View>
          </View>
          <Text variant="bodySmall" style={styles.helperText}>
            Kareyi sürükleyerek konumlandırın, köşelerden büyütüp küçültebilirsiniz
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            disabled={uploading}
          >
            İptal
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={uploading}
            disabled={uploading}
            buttonColor="#000000"
            textColor="#FFFFFF"
          >
            Kaydet
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    margin: 20,
    borderRadius: 16,
    maxWidth: Platform.OS === 'web' ? 600 : '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#000000',
  },
  imageContainer: {
    width: '100%',
    height: 480,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cropBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 4,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  cropBoxBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 4,
  },
  resizeHandle: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 10,
  },
  resizeHandleTopLeft: {
    top: -10,
    left: -10,
  },
  resizeHandleTopRight: {
    top: -10,
    right: -10,
  },
  resizeHandleBottomLeft: {
    bottom: -10,
    left: -10,
  },
  resizeHandleBottomRight: {
    bottom: -10,
    right: -10,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayPart: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controls: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    color: '#000000',
  },
  helperText: {
    marginTop: 8,
    color: '#666666',
    textAlign: 'center',
  },
  sliderContainer: {
    width: '100%',
    marginTop: 8,
  },
  scaleButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  scaleValue: {
    minWidth: 60,
    textAlign: 'center',
    color: '#000000',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});
