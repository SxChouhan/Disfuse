import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../hooks/useWeb3';
import { useIPFS } from '../hooks/useIPFS';
import { ethers } from 'ethers';

interface PostProps {
  postId: number;
  creator: string;
  ipfsHash: string;
  timestamp: number;
  likeCount: number;
  commentCount: number;
  isActive: boolean;
  refreshPosts?: () => void;
}

interface PostData {
  content: string;
  imageCid: string;
  timestamp: number;
}

const Post: React.FC<PostProps> = ({
  postId,
  creator,
  ipfsHash,
  timestamp,
  likeCount,
  commentCount,
  isActive,
  refreshPosts
}) => {
  const { account, socialMediaContract } = useWeb3();
  const { fetchData, getGatewayURL } = useIPFS();

  const [postData, setPostData] = useState<PostData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [profilePic, setProfilePic] = useState<string>('');

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  // Fetch post data from IPFS
  useEffect(() => {
    const getPostData = async () => {
      try {
        setLoading(true);
        const data = await fetchData(ipfsHash);
        setPostData(data);
      } catch (err) {
        console.error('Error fetching post data:', err);
        setError('Failed to load post data');
      } finally {
        setLoading(false);
      }
    };

    getPostData();
  }, [ipfsHash, fetchData]);

  // Check if user has liked the post
  useEffect(() => {
    const checkLiked = async () => {
      if (account && socialMediaContract) {
        try {
          const liked = await socialMediaContract.hasLiked(account, postId);
          setHasLiked(liked);
        } catch (err) {
          console.error('Error checking like status:', err);
        }
      }
    };

    checkLiked();
  }, [account, postId, socialMediaContract]);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (socialMediaContract && creator) {
        try {
          const profile = await socialMediaContract.getProfile(creator);
          setUsername(profile.username);

          // If profile has IPFS data, fetch it
          if (profile.profilePictureIpfsHash) {
            try {
              const profileData = await fetchData(profile.profilePictureIpfsHash);
              if (profileData.profilePictureCid) {
                setProfilePic(getGatewayURL(profileData.profilePictureCid));
              }
            } catch (err) {
              console.error('Error fetching profile picture:', err);
            }
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      }
    };

    fetchUserProfile();
  }, [creator, socialMediaContract, fetchData, getGatewayURL]);

  // Handle like/unlike
  const handleLike = async () => {
    if (!account || !socialMediaContract) return;

    setIsLiking(true);

    try {
      if (hasLiked) {
        await socialMediaContract.unlikePost(postId);
      } else {
        await socialMediaContract.likePost(postId);
      }

      // Wait for transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 2000));

      setHasLiked(!hasLiked);
      if (refreshPosts) refreshPosts();
    } catch (err) {
      console.error('Error liking/unliking post:', err);
    } finally {
      setIsLiking(false);
    }
  };

  if (loading) {
    return (
      <div className="card mb-6 animate-pulse">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 rounded-full bg-gray-600"></div>
          <div className="ml-3 h-4 w-24 bg-gray-600 rounded"></div>
        </div>
        <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-600 rounded w-1/2 mb-4"></div>
        <div className="h-40 bg-gray-600 rounded mb-4"></div>
      </div>
    );
  }

  if (error || !postData) {
    return (
      <div className="card mb-6">
        <div className="text-red-500">
          {error || 'Failed to load post data'}
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-6 transition-all hover:shadow-[0_0_10px_rgba(0,255,136,0.2)]">
      <div className="flex items-center mb-3">
        <Link to={`/profile/${creator}`}>
          {profilePic ? (
            <img
              src={profilePic}
              alt={username || formatAddress(creator)}
              className="w-10 h-10 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white">
              {(username || creator).charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
        <div className="ml-3 overflow-hidden">
          <Link to={`/profile/${creator}`} className="font-semibold hover:text-neonGreen truncate block">
            {username || formatAddress(creator)}
          </Link>
          <div className="text-gray-400 text-xs">
            {formatDate(timestamp)}
          </div>
        </div>
      </div>

      <p className="text-gray-300 mb-4 break-words">{postData.content}</p>

      {postData.imageCid && (
        <div className="mb-4 relative">
          <img
            src={getGatewayURL(postData.imageCid)}
            alt="Post"
            className="rounded-lg w-full object-cover max-h-[500px]"
            loading="lazy"
            onError={(e) => {
              // Handle image loading error
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=Image+Not+Available';
            }}
          />
        </div>
      )}

      <div className="flex mt-4 space-x-4 flex-wrap">
        <button
          className={`flex items-center ${hasLiked ? 'text-neonGreen' : 'text-gray-400 hover:text-neonGreen'} transition-colors`}
          onClick={handleLike}
          disabled={isLiking}
          aria-label={hasLiked ? "Unlike post" : "Like post"}
        >
          {isLiking ? (
            <span className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-neonGreen"></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={hasLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
          <span className="ml-2">{likeCount}</span>
        </button>

        <Link to={`/post/${postId}`} className="flex items-center text-gray-400 hover:text-neonGreen transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="ml-2">{commentCount}</span>
        </Link>

        <div className="ml-auto flex items-center">
          <button
            className="flex items-center text-gray-400 hover:text-neonGreen transition-colors"
            onClick={() => {
              // Copy post link to clipboard
              const url = `${window.location.origin}/post/${postId}`;
              navigator.clipboard.writeText(url);

              // Show a toast or some feedback (simplified here)
              alert('Post link copied to clipboard!');
            }}
            aria-label="Share post"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Post;
