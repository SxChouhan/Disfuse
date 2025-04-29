import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import CreatePost from '../components/CreatePost';
import Post from '../components/Post';
import { useWeb3 } from '../hooks/useWeb3';

const Home: React.FC = () => {
  const { socialMediaContract, isConnected, isMetaMaskInstalled } = useWeb3();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const postsPerPage = 5;

  // Fetch posts
  const fetchPosts = async (reset = true) => {
    if (!socialMediaContract) return;

    try {
      if (reset) {
        setLoading(true);
        setPage(1);
        setPosts([]);
      } else {
        setLoadingMore(true);
      }

      const totalPosts = await socialMediaContract.getTotalPosts();
      const totalPostsNumber = totalPosts.toNumber();

      if (totalPostsNumber === 0) {
        setPosts([]);
        setHasMore(false);
        return;
      }

      const currentPage = reset ? 1 : page;
      const endIndex = totalPostsNumber;
      const startIndex = Math.max(1, endIndex - (currentPage * postsPerPage) + 1);
      const fetchLimit = Math.min(postsPerPage, endIndex - startIndex + 1);

      // Check if there are more posts to load
      setHasMore(startIndex > 1);

      const fetchedPosts = [];

      for (let i = endIndex - ((currentPage - 1) * postsPerPage); i > endIndex - (currentPage * postsPerPage) && i > 0; i--) {
        try {
          const post = await socialMediaContract.getPost(i);
          fetchedPosts.push({
            id: post.id.toNumber(),
            creator: post.creator,
            ipfsHash: post.ipfsHash,
            timestamp: post.timestamp.toNumber(),
            likeCount: post.likeCount.toNumber(),
            commentCount: post.commentCount.toNumber(),
            isActive: post.isActive
          });
        } catch (err) {
          console.error(`Error fetching post ${i}:`, err);
        }
      }

      if (reset) {
        setPosts(fetchedPosts);
      } else {
        setPosts(prev => [...prev, ...fetchedPosts]);
      }

      if (!reset) {
        setPage(currentPage + 1);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more posts
  const loadMorePosts = () => {
    fetchPosts(false);
  };

  // Fetch posts on component mount and when contract changes
  useEffect(() => {
    if (socialMediaContract) {
      fetchPosts();
    }
  }, [socialMediaContract]);

  return (
    <div className="min-h-screen bg-darkBg">
      <Navigation />

      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {!isMetaMaskInstalled && (
            <div className="card mb-6 text-center">
              <h2 className="text-xl font-bold mb-2">Welcome to Disfuse!</h2>
              <p className="mb-4">To interact with this decentralized social media platform, you need a Web3 wallet.</p>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-block"
              >
                Install MetaMask
              </a>
            </div>
          )}

          {isMetaMaskInstalled && !isConnected && (
            <div className="card mb-6 text-center">
              <h2 className="text-xl font-bold mb-2">Welcome to Disfuse!</h2>
              <p className="mb-4">Connect your wallet to start posting and interacting with the community.</p>
            </div>
          )}

          <CreatePost onPostCreated={() => fetchPosts(true)} />

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
                onClick={() => fetchPosts(true)}
              >
                Try Again
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-400">No posts yet. Be the first to post!</p>
            </div>
          ) : (
            <>
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
                    refreshPosts={() => fetchPosts(true)}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    className="btn-secondary"
                    onClick={loadMorePosts}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-neonGreen mr-2"></span>
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
