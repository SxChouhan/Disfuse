import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Profile from '../components/Profile';
import Post from '../components/Post';
import { useWeb3 } from '../hooks/useWeb3';

const ProfilePage: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const { account, socialMediaContract } = useWeb3();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const profileAddress = address || account;

  // Fetch user's posts
  const fetchUserPosts = async () => {
    if (!socialMediaContract || !profileAddress) return;
    
    try {
      setLoading(true);
      
      const totalPosts = await socialMediaContract.getTotalPosts();
      const fetchedPosts = [];
      
      // Fetch all posts and filter by creator
      for (let i = totalPosts.toNumber(); i >= 1; i--) {
        try {
          const post = await socialMediaContract.getPost(i);
          
          if (post.creator.toLowerCase() === profileAddress.toLowerCase()) {
            fetchedPosts.push({
              id: post.id.toNumber(),
              creator: post.creator,
              ipfsHash: post.ipfsHash,
              timestamp: post.timestamp.toNumber(),
              likeCount: post.likeCount.toNumber(),
              commentCount: post.commentCount.toNumber(),
              isActive: post.isActive
            });
          }
        } catch (err) {
          console.error(`Error fetching post ${i}:`, err);
        }
      }
      
      setPosts(fetchedPosts);
    } catch (err) {
      console.error('Error fetching user posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch posts on component mount and when contract or address changes
  useEffect(() => {
    if (socialMediaContract && profileAddress) {
      fetchUserPosts();
    }
  }, [socialMediaContract, profileAddress]);

  return (
    <div className="min-h-screen bg-darkBg">
      <Navigation />
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Profile address={address} />
          
          <h2 className="text-xl font-bold mt-8 mb-4">Posts</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neonGreen mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading posts...</p>
            </div>
          ) : error ? (
            <div className="card text-center py-8">
              <p className="text-red-500">{error}</p>
              <button 
                className="btn-primary mt-4"
                onClick={fetchUserPosts}
              >
                Try Again
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-400">No posts yet.</p>
            </div>
          ) : (
            posts.map((post) => (
              <Post
                key={post.id}
                postId={post.id}
                creator={post.creator}
                ipfsHash={post.ipfsHash}
                timestamp={post.timestamp}
                likeCount={post.likeCount}
                commentCount={post.commentCount}
                isActive={post.isActive}
                refreshPosts={fetchUserPosts}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
