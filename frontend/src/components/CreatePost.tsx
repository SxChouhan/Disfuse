import React, { useState, useRef } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { useIPFS } from '../hooks/useIPFS';

interface CreatePostProps {
  onPostCreated?: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const { account, socialMediaContract, isConnected } = useWeb3();
  const { uploadPost } = useIPFS();

  const [content, setContent] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Create post
  const createPost = async () => {
    if (!isConnected || !account || !socialMediaContract) {
      setError('Please connect your wallet first');
      return;
    }

    if (!content.trim()) {
      setError('Please enter some content for your post');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload content to IPFS
      const ipfsHash = await uploadPost(content, image || undefined);

      // Create post on blockchain
      const tx = await socialMediaContract.createPost(ipfsHash);
      await tx.wait();

      // Reset form
      setContent('');
      setImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Notify parent component
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mb-8">
      <textarea
        className="w-full bg-transparent border-none focus:outline-none resize-none"
        placeholder={isConnected ? "What's happening in the decentralized world?" : "Connect your wallet to post..."}
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={!isConnected || loading}
      />

      {imagePreview && (
        <div className="relative mt-2 mb-4">
          <img
            src={imagePreview}
            alt="Preview"
            className="rounded-lg max-h-64 mx-auto object-contain"
          />
          <button
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            onClick={removeImage}
            aria-label="Remove image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm mb-4 p-2 bg-red-500/10 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mt-4 flex-wrap gap-2">
        <div className="flex items-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            ref={fileInputRef}
            className="hidden"
            id="image-upload"
            disabled={!isConnected || loading}
          />
          <label
            htmlFor="image-upload"
            className={`text-gray-400 hover:text-neonGreen cursor-pointer transition-colors p-2 rounded-full hover:bg-darkSecondary ${!isConnected && 'opacity-50 cursor-not-allowed'}`}
            aria-label="Upload image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </label>

          {/* Character count */}
          <div className={`ml-2 text-sm ${content.length > 280 ? 'text-red-500' : 'text-gray-400'}`}>
            {content.length}/280
          </div>
        </div>

        <button
          className={`btn-primary transition-all ${(!isConnected || loading || !content.trim() || content.length > 280) && 'opacity-50 cursor-not-allowed'}`}
          onClick={createPost}
          disabled={!isConnected || loading || !content.trim() || content.length > 280}
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-darkBg mr-2"></span>
              Posting...
            </>
          ) : (
            'Post'
          )}
        </button>
      </div>

      {!isConnected && (
        <div className="mt-4 text-center text-sm text-gray-400">
          Connect your wallet to create posts and interact with the community
        </div>
      )}
    </div>
  );
};

export default CreatePost;
