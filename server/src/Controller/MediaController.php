<?php
declare(strict_types=1);

namespace App\Controller;

use Cake\Http\Response;
use Cake\Validation\Validator;

/**
 * Media Controller
 *
 * Handles file uploads for posts (images, videos, documents)
 * Provides secure file storage and validation
 */
class MediaController extends AppController
{
    /**
     * Initialize method
     *
     * @return void
     */
    public function initialize(): void
    {
        parent::initialize();
    }

    /**
     * Upload media files
     *
     * @return \Cake\Http\Response
     */
    public function upload(): Response
    {
        $this->request->allowMethod('post');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        $uploadedFiles = $this->request->getUploadedFiles();
        if (empty($uploadedFiles['files'])) {
            return $this->apiError('No files uploaded', 400);
        }

        $files = $uploadedFiles['files'];
        if (!is_array($files)) {
            $files = [$files];
        }

        $mediaTable = $this->fetchTable('MediaFiles');
        $uploadedMedia = [];
        $errors = [];

        foreach ($files as $index => $file) {
            try {
                $result = $this->processFileUpload($file, $currentUser);
                if ($result['success']) {
                    $mediaEntity = $mediaTable->newEntity([
                        'organization_id' => $currentUser->organization_id,
                        'uploaded_by' => $currentUser->id,
                        'file_name' => $result['original_name'],
                        'file_path' => $result['file_path'],
                        'file_type' => $result['file_type'],
                        'file_size' => $result['file_size'],
                        'mime_type' => $result['mime_type'],
                    ]);

                    if ($mediaTable->save($mediaEntity)) {
                        $uploadedMedia[] = [
                            'id' => $mediaEntity->id,
                            'file_name' => $mediaEntity->file_name,
                            'file_path' => $mediaEntity->file_path,
                            'file_type' => $mediaEntity->file_type,
                            'file_size' => $mediaEntity->file_size,
                            'mime_type' => $mediaEntity->mime_type,
                            'created' => $mediaEntity->created,
                        ];
                    } else {
                        $errors[] = "Failed to save file {$result['original_name']} to database";
                        // Clean up uploaded file
                        $this->deleteFile($result['file_path']);
                    }
                } else {
                    $errors[] = $result['error'];
                }
            } catch (\Exception $e) {
                $errors[] = "Error processing file at index {$index}: " . $e->getMessage();
            }
        }

        if (empty($uploadedMedia)) {
            return $this->apiError('No files were uploaded successfully', 400, ['errors' => $errors]);
        }

        $response = [
            'uploaded_files' => $uploadedMedia,
            'total_uploaded' => count($uploadedMedia),
        ];

        if (!empty($errors)) {
            $response['errors'] = $errors;
        }

        return $this->apiSuccess($response, 'Files uploaded successfully', 201);
    }

    /**
     * Get media file information
     *
     * @param int $id Media file ID
     * @return \Cake\Http\Response
     */
    public function view(int $id): Response
    {
        $this->request->allowMethod('get');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        $mediaTable = $this->fetchTable('MediaFiles');

        try {
            $media = $mediaTable->get($id, [
                'conditions' => ['organization_id' => $currentUser->organization_id],
                'contain' => [
                    'Users' => ['fields' => ['id', 'first_name', 'last_name']],
                    'Posts' => ['fields' => ['id', 'title', 'status']]
                ]
            ]);
        } catch (\Exception $e) {
            return $this->apiError('Media file not found', 404);
        }

        $mediaData = [
            'id' => $media->id,
            'file_name' => $media->file_name,
            'file_path' => $media->file_path,
            'file_type' => $media->file_type,
            'file_size' => $media->file_size,
            'mime_type' => $media->mime_type,
            'created' => $media->created,
            'uploaded_by' => [
                'id' => $media->user->id,
                'name' => $media->user->first_name . ' ' . $media->user->last_name,
            ],
            'associated_posts' => array_map(function ($post) {
                return [
                    'id' => $post->id,
                    'title' => $post->title,
                    'status' => $post->status,
                ];
            }, $media->posts),
            'url' => $this->request->getScheme() . '://' . $this->request->getHost() . '/' . $media->file_path,
        ];

        return $this->apiSuccess($mediaData, 'Media file retrieved successfully');
    }

    /**
     * Delete a media file
     *
     * @param int $id Media file ID
     * @return \Cake\Http\Response
     */
    public function delete(int $id): Response
    {
        $this->request->allowMethod('delete');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        $mediaTable = $this->fetchTable('MediaFiles');

        try {
            $media = $mediaTable->get($id, [
                'conditions' => ['organization_id' => $currentUser->organization_id],
                'contain' => ['Posts']
            ]);
        } catch (\Exception $e) {
            return $this->apiError('Media file not found', 404);
        }

        // Check if user can delete this file
        if ($media->uploaded_by !== $currentUser->id && !$currentUser->isManager()) {
            return $this->apiError('Permission denied', 403);
        }

        // Check if file is being used in any posts
        if (!empty($media->posts)) {
            $activePosts = array_filter($media->posts, function ($post) {
                return in_array($post->status, ['pending_approval', 'approved', 'scheduled', 'published']);
            });

            if (!empty($activePosts)) {
                return $this->apiError('Cannot delete media file that is being used in active posts', 400);
            }
        }

        // Delete physical file
        $filePath = WWW_ROOT . $media->file_path;
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        // Delete database record
        if ($mediaTable->delete($media)) {
            return $this->apiSuccess(null, 'Media file deleted successfully');
        }

        return $this->apiError('Failed to delete media file', 400);
    }

    /**
     * Get media files for organization
     *
     * @return \Cake\Http\Response
     */
    public function index(): Response
    {
        $this->request->allowMethod('get');

        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            return $this->apiError('Authentication required', 401);
        }

        $mediaTable = $this->fetchTable('MediaFiles');

        $conditions = ['organization_id' => $currentUser->organization_id];

        // Filter by file type
        $fileType = $this->request->getQuery('file_type');
        if ($fileType) {
            $conditions['file_type'] = $fileType;
        }

        // Filter by user (for non-managers, show only their files)
        if (!$currentUser->isManager()) {
            $conditions['uploaded_by'] = $currentUser->id;
        }

        $query = $mediaTable->find()
            ->where($conditions)
            ->contain([
                'Users' => ['fields' => ['id', 'first_name', 'last_name']],
                'Posts' => ['fields' => ['id', 'title', 'status']]
            ])
            ->order(['created' => 'DESC']);

        // Add pagination
        $page = (int)$this->request->getQuery('page', 1);
        $limit = min((int)$this->request->getQuery('limit', 20), 50);

        $mediaFiles = $query->limit($limit)->offset(($page - 1) * $limit)->toArray();
        $total = $query->count();

        $mediaData = [];
        foreach ($mediaFiles as $media) {
            $mediaData[] = [
                'id' => $media->id,
                'file_name' => $media->file_name,
                'file_path' => $media->file_path,
                'file_type' => $media->file_type,
                'file_size' => $media->file_size,
                'mime_type' => $media->mime_type,
                'created' => $media->created,
                'uploaded_by' => [
                    'id' => $media->user->id,
                    'name' => $media->user->first_name . ' ' . $media->user->last_name,
                ],
                'posts_count' => count($media->posts),
                'url' => $this->request->getScheme() . '://' . $this->request->getHost() . '/' . $media->file_path,
            ];
        }

        $response = [
            'media_files' => $mediaData,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit),
            ],
        ];

        return $this->apiSuccess($response, 'Media files retrieved successfully');
    }

    /**
     * Process and validate file upload
     *
     * @param \Psr\Http\Message\UploadedFileInterface $file Uploaded file
     * @param object $user Current user
     * @return array Result array with success status and data/error
     */
    private function processFileUpload($file, $user): array
    {
        // Check for upload errors
        if ($file->getError() !== UPLOAD_ERR_OK) {
            return [
                'success' => false,
                'error' => 'File upload error: ' . $this->getUploadErrorMessage($file->getError())
            ];
        }

        $originalName = $file->getClientFilename();
        $mimeType = $file->getClientMediaType();
        $fileSize = $file->getSize();

        // Validate file type
        $allowedTypes = [
            // Images
            'image/jpeg' => 'image',
            'image/png' => 'image',
            'image/gif' => 'image',
            'image/webp' => 'image',
            'image/svg+xml' => 'image',
            // Videos
            'video/mp4' => 'video',
            'video/quicktime' => 'video',
            'video/x-msvideo' => 'video',
            'video/webm' => 'video',
            // Documents
            'application/pdf' => 'document',
            'text/plain' => 'document',
        ];

        if (!isset($allowedTypes[$mimeType])) {
            return [
                'success' => false,
                'error' => "File type '{$mimeType}' is not allowed"
            ];
        }

        $fileType = $allowedTypes[$mimeType];

        // Validate file size (50MB max)
        $maxSize = 50 * 1024 * 1024; // 50MB
        if ($fileSize > $maxSize) {
            return [
                'success' => false,
                'error' => 'File size exceeds maximum allowed size of 50MB'
            ];
        }

        // Generate unique filename
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        $filename = 'media_' . uniqid() . '_' . time() . '.' . $extension;

        // Create upload directory structure
        $uploadDir = 'uploads' . DS . 'media' . DS . date('Y') . DS . date('m') . DS;
        $fullUploadDir = WWW_ROOT . $uploadDir;

        if (!is_dir($fullUploadDir)) {
            if (!mkdir($fullUploadDir, 0755, true)) {
                return [
                    'success' => false,
                    'error' => 'Failed to create upload directory'
                ];
            }
        }

        $targetPath = $fullUploadDir . $filename;
        $relativePath = $uploadDir . $filename;

        // Move uploaded file
        try {
            $file->moveTo($targetPath);

            // Additional processing for images
            if ($fileType === 'image') {
                $this->processImageFile($targetPath, $mimeType);
            }

            return [
                'success' => true,
                'original_name' => $originalName,
                'file_path' => str_replace(DS, '/', $relativePath),
                'file_type' => $fileType,
                'file_size' => $fileSize,
                'mime_type' => $mimeType,
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to save file: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process image files (resize, optimize)
     *
     * @param string $filePath Path to the image file
     * @param string $mimeType MIME type of the image
     * @return void
     */
    private function processImageFile(string $filePath, string $mimeType): void
    {
        // For now, just basic validation
        // TODO: Implement image resizing and optimization

        $imageInfo = getimagesize($filePath);
        if ($imageInfo === false) {
            throw new \Exception('Invalid image file');
        }

        // Check image dimensions
        $maxWidth = 4000;
        $maxHeight = 4000;

        if ($imageInfo[0] > $maxWidth || $imageInfo[1] > $maxHeight) {
            // TODO: Implement image resizing
            // For now, just log a warning
            error_log("Large image uploaded: {$imageInfo[0]}x{$imageInfo[1]} - {$filePath}");
        }
    }

    /**
     * Get upload error message
     *
     * @param int $errorCode Upload error code
     * @return string Error message
     */
    private function getUploadErrorMessage(int $errorCode): string
    {
        $errors = [
            UPLOAD_ERR_INI_SIZE => 'The uploaded file exceeds the upload_max_filesize directive in php.ini',
            UPLOAD_ERR_FORM_SIZE => 'The uploaded file exceeds the MAX_FILE_SIZE directive',
            UPLOAD_ERR_PARTIAL => 'The uploaded file was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload',
        ];

        return $errors[$errorCode] ?? 'Unknown upload error';
    }

    /**
     * Delete a file from the server
     *
     * @param string $filePath File path relative to webroot
     * @return bool
     */
    private function deleteFile(string $filePath): bool
    {
        $fullPath = WWW_ROOT . $filePath;
        if (file_exists($fullPath)) {
            return unlink($fullPath);
        }
        return false;
    }
}
