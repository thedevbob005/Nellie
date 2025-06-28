// Enhanced Media Uploader Component
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  ProgressBar,
  IconButton,
  Surface,
  Chip,
  Portal,
  Modal,
  List,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Video } from 'expo-av';

const { width: screenWidth } = Dimensions.get('window');

export interface MediaFile {
  id: string;
  uri: string;
  type: 'image' | 'video' | 'document';
  name: string;
  size: number;
  mimeType: string;
  uploadProgress: number;
  isUploading: boolean;
  isUploaded: boolean;
  uploadError?: string;
  preview?: string;
}

interface MediaUploaderProps {
  onFilesChange: (files: MediaFile[]) => void;
  maxFiles?: number;
  allowedTypes?: ('image' | 'video' | 'document')[];
  maxFileSize?: number; // in bytes
  initialFiles?: MediaFile[];
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  onFilesChange,
  maxFiles = 10,
  allowedTypes = ['image', 'video'],
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  initialFiles = [],
}) => {
  const [files, setFiles] = useState<MediaFile[]>(initialFiles);
  const [isPickerModalVisible, setIsPickerModalVisible] = useState(false);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);

  // Request permissions on component mount
  React.useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and photo library permissions are required to upload media.',
        [{ text: 'OK' }]
      );
    }
  };

  const updateFiles = (newFiles: MediaFile[]) => {
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  const generateFileId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const getFileType = (mimeType: string): 'image' | 'video' | 'document' => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
  };

  const validateFile = (file: any): boolean => {
    // Check file size
    if (file.size && file.size > maxFileSize) {
      Alert.alert(
        'File Too Large',
        `File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB`
      );
      return false;
    }

    // Check file type
    const fileType = getFileType(file.mimeType || file.type || '');
    if (!allowedTypes.includes(fileType)) {
      Alert.alert(
        'Invalid File Type',
        `Only ${allowedTypes.join(', ')} files are allowed`
      );
      return false;
    }

    // Check max files limit
    if (files.length >= maxFiles) {
      Alert.alert(
        'Maximum Files Reached',
        `You can only upload up to ${maxFiles} files`
      );
      return false;
    }

    return true;
  };

  const createMediaFile = (pickerResult: any): MediaFile => {
    const fileName = pickerResult.fileName || pickerResult.uri.split('/').pop() || 'unknown';
    
    return {
      id: generateFileId(),
      uri: pickerResult.uri,
      type: getFileType(pickerResult.mimeType || pickerResult.type || ''),
      name: fileName,
      size: pickerResult.fileSize || pickerResult.size || 0,
      mimeType: pickerResult.mimeType || pickerResult.type || '',
      uploadProgress: 0,
      isUploading: false,
      isUploaded: false,
      preview: pickerResult.uri,
    };
  };

  const pickImageFromCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        videoQuality: ImagePicker.VideoQuality.High,
        videoMaxDuration: 300, // 5 minutes
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (validateFile(asset)) {
          const mediaFile = createMediaFile(asset);
          const newFiles = [...files, mediaFile];
          updateFiles(newFiles);
          startUpload(mediaFile);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture media from camera');
    }
    setIsPickerModalVisible(false);
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: maxFiles - files.length,
        videoQuality: ImagePicker.VideoQuality.High,
        videoMaxDuration: 300,
      });

      if (!result.canceled && result.assets) {
        const validAssets = result.assets.filter(validateFile);
        const newMediaFiles = validAssets.map(createMediaFile);
        const newFiles = [...files, ...newMediaFiles];
        updateFiles(newFiles);
        
        // Start upload for each file
        newMediaFiles.forEach(startUpload);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick media from gallery');
    }
    setIsPickerModalVisible(false);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const validAssets = result.assets.filter(validateFile);
        const newMediaFiles = validAssets.map(createMediaFile);
        const newFiles = [...files, ...newMediaFiles];
        updateFiles(newFiles);
        
        // Start upload for each file
        newMediaFiles.forEach(startUpload);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick documents');
    }
    setIsPickerModalVisible(false);
  };

  const startUpload = async (mediaFile: MediaFile) => {
    const updatedFiles = files.map(f => 
      f.id === mediaFile.id 
        ? { ...f, isUploading: true, uploadProgress: 0 }
        : f
    );
    updateFiles(updatedFiles);

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const progressUpdatedFiles = files.map(f => 
          f.id === mediaFile.id 
            ? { ...f, uploadProgress: progress }
            : f
        );
        updateFiles(progressUpdatedFiles);
      }

      // Mark as uploaded
      const completedFiles = files.map(f => 
        f.id === mediaFile.id 
          ? { ...f, isUploading: false, isUploaded: true, uploadProgress: 100 }
          : f
      );
      updateFiles(completedFiles);

    } catch (error) {
      const errorFiles = files.map(f => 
        f.id === mediaFile.id 
          ? { 
              ...f, 
              isUploading: false, 
              uploadError: 'Upload failed',
              uploadProgress: 0 
            }
          : f
      );
      updateFiles(errorFiles);
    }
  };

  const removeFile = (fileId: string) => {
    const newFiles = files.filter(f => f.id !== fileId);
    updateFiles(newFiles);
  };

  const retryUpload = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      const retryFiles = files.map(f => 
        f.id === fileId 
          ? { ...f, uploadError: undefined, uploadProgress: 0 }
          : f
      );
      updateFiles(retryFiles);
      startUpload(file);
    }
  };

  const openPreview = (file: MediaFile) => {
    setPreviewFile(file);
    setIsPreviewModalVisible(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string, mimeType: string) => {
    if (type === 'image') return 'image';
    if (type === 'video') return 'videocam';
    if (mimeType.includes('pdf')) return 'document-text';
    return 'document';
  };

  const renderFilePreview = (file: MediaFile) => (
    <Card key={file.id} style={styles.fileCard}>
      <TouchableOpacity onPress={() => openPreview(file)}>
        <View style={styles.fileHeader}>
          {file.type === 'image' && file.preview ? (
            <Image source={{ uri: file.preview }} style={styles.previewImage} />
          ) : (
            <View style={styles.fileIconContainer}>
              <Ionicons 
                name={getFileIcon(file.type, file.mimeType) as any} 
                size={40} 
                color="#6366f1" 
              />
            </View>
          )}
          
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={2}>
              {file.name}
            </Text>
            <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
            
            {file.isUploading && (
              <View style={styles.progressContainer}>
                <ProgressBar 
                  progress={file.uploadProgress / 100} 
                  color="#6366f1"
                  style={styles.progressBar}
                />
                <Text style={styles.progressText}>{file.uploadProgress}%</Text>
              </View>
            )}
            
            {file.isUploaded && (
              <Chip icon="check" mode="outlined" style={styles.successChip}>
                Uploaded
              </Chip>
            )}
            
            {file.uploadError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{file.uploadError}</Text>
                <Button 
                  mode="text" 
                  onPress={() => retryUpload(file.id)}
                  style={styles.retryButton}
                >
                  Retry
                </Button>
              </View>
            )}
          </View>
          
          <IconButton
            icon="close"
            size={20}
            onPress={() => removeFile(file.id)}
            style={styles.removeButton}
          />
        </View>
      </TouchableOpacity>
    </Card>
  );

  const renderPickerOptions = () => (
    <View>
      {allowedTypes.includes('image') && (
        <>
          <List.Item
            title="Camera"
            description="Take a photo or record a video"
            left={() => <List.Icon icon="camera" />}
            onPress={pickImageFromCamera}
          />
          <List.Item
            title="Photo Library"
            description="Choose from your photos and videos"
            left={() => <List.Icon icon="image-multiple" />}
            onPress={pickImageFromGallery}
          />
        </>
      )}
      
      {allowedTypes.includes('document') && (
        <>
          <Divider />
          <List.Item
            title="Documents"
            description="Choose documents, PDFs, and other files"
            left={() => <List.Icon icon="file-document" />}
            onPress={pickDocument}
          />
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Upload Button */}
      <Button
        mode="outlined"
        icon="plus"
        onPress={() => setIsPickerModalVisible(true)}
        style={styles.uploadButton}
        disabled={files.length >= maxFiles}
      >
        Add Media ({files.length}/{maxFiles})
      </Button>

      {/* Files Preview */}
      {files.length > 0 && (
        <ScrollView style={styles.filesContainer} showsVerticalScrollIndicator={false}>
          {files.map(renderFilePreview)}
        </ScrollView>
      )}

      {/* Upload Progress Summary */}
      {files.some(f => f.isUploading) && (
        <Surface style={styles.uploadSummary}>
          <ActivityIndicator size="small" color="#6366f1" />
          <Text style={styles.uploadSummaryText}>
            Uploading {files.filter(f => f.isUploading).length} files...
          </Text>
        </Surface>
      )}

      {/* File Picker Modal */}
      <Portal>
        <Modal
          visible={isPickerModalVisible}
          onDismiss={() => setIsPickerModalVisible(false)}
          contentContainerStyle={styles.pickerModal}
        >
          <Text style={styles.pickerTitle}>Choose Media Source</Text>
          {renderPickerOptions()}
          <Button 
            mode="text" 
            onPress={() => setIsPickerModalVisible(false)}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </Modal>
      </Portal>

      {/* Preview Modal */}
      <Portal>
        <Modal
          visible={isPreviewModalVisible}
          onDismiss={() => setIsPreviewModalVisible(false)}
          contentContainerStyle={styles.previewModal}
        >
          {previewFile && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>{previewFile.name}</Text>
              
              {previewFile.type === 'image' && previewFile.preview && (
                <Image 
                  source={{ uri: previewFile.preview }} 
                  style={styles.previewFullImage}
                  resizeMode="contain"
                />
              )}
              
              {previewFile.type === 'video' && previewFile.preview && (
                <Video
                  source={{ uri: previewFile.preview }}
                  style={styles.previewVideo}
                  useNativeControls
                  resizeMode="contain"
                />
              )}
              
              <View style={styles.previewInfo}>
                <Text style={styles.previewInfoText}>
                  Size: {formatFileSize(previewFile.size)}
                </Text>
                <Text style={styles.previewInfoText}>
                  Type: {previewFile.mimeType}
                </Text>
              </View>
              
              <Button 
                mode="contained" 
                onPress={() => setIsPreviewModalVisible(false)}
                style={styles.closePreviewButton}
              >
                Close
              </Button>
            </View>
          )}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  uploadButton: {
    marginBottom: 16,
    borderColor: '#6366f1',
  },
  filesContainer: {
    maxHeight: 400,
  },
  fileCard: {
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
  },
  fileHeader: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  fileIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    marginRight: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  successChip: {
    alignSelf: 'flex-start',
    borderColor: '#10b981',
  },
  errorContainer: {
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginBottom: 4,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: -8,
  },
  removeButton: {
    margin: 0,
  },
  uploadSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    elevation: 1,
  },
  uploadSummaryText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6366f1',
  },
  pickerModal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 16,
  },
  previewModal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  previewFullImage: {
    width: screenWidth - 80,
    height: 300,
    marginBottom: 16,
  },
  previewVideo: {
    width: screenWidth - 80,
    height: 200,
    marginBottom: 16,
  },
  previewInfo: {
    marginBottom: 16,
  },
  previewInfoText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  closePreviewButton: {
    backgroundColor: '#6366f1',
  },
});

export default MediaUploader; 