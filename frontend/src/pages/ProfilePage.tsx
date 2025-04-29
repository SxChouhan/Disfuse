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
  const isOwnProfile = !address || address === account;

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
        <div className="max-w-3xl mx-auto">
          {/* Profile Header */}
          <div className="bg-darkSecondary rounded-lg shadow-lg overflow-hidden mb-8">
            {/* Cover Photo */}
            <div className="h-48 bg-gradient-to-r from-purple-500 to-neonGreen"></div>

            {/* Profile Info */}
            <div className="px-6 py-4 relative">
              {/* Profile Picture */}
              <div className="absolute -top-16 left-6 w-32 h-32 rounded-full border-4 border-darkSecondary bg-gray-700 overflow-hidden">
                {/* Profile component will handle the actual image */}
              </div>

              {/* Profile Content */}
              <div className="ml-36">
                <Profile address={address} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-700 mb-6">
            <nav className="flex">
              <button className="px-4 py-2 border-b-2 border-neonGreen text-neonGreen font-medium">
                Posts
              </button>
              <button className="px-4 py-2 text-gray-400 hover:text-white">
                Media
              </button>
              <button className="px-4 py-2 text-gray-400 hover:text-white">
                Likes
              </button>
            </nav>
          </div>

          {/* Create Post Section */}
          {isOwnProfile && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Share Something</h2>
              <div className="card">
                <textarea
                  className="w-full bg-transparent border-none focus:outline-none resize-none"
                  placeholder="What's on your mind?"
                  rows={3}
                ></textarea>

                <div className="flex justify-between items-center mt-4">
                  <div className="flex space-x-2">
                    <button className="text-gray-400 hover:text-neonGreen p-2 rounded-full hover:bg-darkSecondary">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>

                  <button className="btn-primary">
                    Post
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Posts Section */}
          <div>
            <h2 className="text-xl font-bold mb-4">Posts</h2>

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
                {isOwnProfile && (
                  <p className="mt-2 text-gray-400">Share your first post with the community!</p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
