import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Post from '../components/Post';
import { useWeb3 } from '../hooks/useWeb3';
import { useIPFS } from '../hooks/useIPFS';

interface Comment {
  id: number;
  creator: string;
  content: string;
  timestamp: number;
}

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { account, socialMediaContract } = useWeb3();
  const { fetchData } = useIPFS();
  
  const [post, setPost] = useState<any | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [commentLoading, setCommentLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [usernames, setUsernames] = useState<Record<string, string>>({});

  // Fetch post details
  const fetchPostDetails = async () => {
    if (!socialMediaContract || !id) return;
    
    try {
      setLoading(true);
      
      const postId = parseInt(id);
      const postData = await socialMediaContract.getPost(postId);
      
      setPost({
        id: postData.id.toNumber(),
        creator: postData.creator,
        ipfsHash: postData.ipfsHash,
        timestamp: postData.timestamp.toNumber(),
        likeCount: postData.likeCount.toNumber(),
        commentCount: postData.commentCount.toNumber(),
        isActive: postData.isActive
      });
      
      // Fetch comments (this is a simplified approach since our contract doesn't have a direct way to fetch comments)
      // In a real implementation, you would have a way to fetch comments for a specific post
      // For now, we'll just show a placeholder
      setComments([]);
    } catch (err) {
      console.error('Error fetching post details:', err);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  // Fetch usernames for comment creators
  const fetchUsernames = async (addresses: string[]) => {
    if (!socialMediaContract) return;
    
    const uniqueAddresses = [...new Set(addresses)];
    const usernameMap: Record<string, string> = {};
    
    for (const address of uniqueAddresses) {
      try {
        const profile = await socialMediaContract.getProfile(address);
        
        if (profile.profilePictureIpfsHash) {
          try {
            const profileData = await fetchData(profile.profilePictureIpfsHash);
            usernameMap[address.toLowerCase()] = profileData.username || formatAddress(address);
          } catch (err) {
            usernameMap[address.toLowerCase()] = profile.username || formatAddress(address);
          }
        } else {
          usernameMap[address.toLowerCase()] = profile.username || formatAddress(address);
        }
      } catch (err) {
        usernameMap[address.toLowerCase()] = formatAddress(address);
      }
    }
    
    setUsernames(usernameMap);
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  // Add a comment
  const addComment = async () => {
    if (!socialMediaContract || !account || !id || !newComment.trim()) {
      return;
    }
    
    setCommentLoading(true);
    setCommentError(null);
    
    try {
      const postId = parseInt(id);
      const tx = await socialMediaContract.addComment(postId, newComment);
      await tx.wait();
      
      // Clear comment input
      setNewComment('');
      
      // Refresh post details to get updated comment count
      fetchPostDetails();
      
      // Add the new comment to the list (in a real implementation, you would fetch the actual comment from the blockchain)
      const newCommentObj: Comment = {
        id: Date.now(), // Placeholder ID
        creator: account,
        content: newComment,
        timestamp: Math.floor(Date.now() / 1000)
      };
      
      setComments(prev => [newCommentObj, ...prev]);
      
      // Update usernames
      if (!usernames[account.toLowerCase()]) {
        fetchUsernames([account]);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setCommentError('Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  // Fetch post details on component mount and when contract or ID changes
  useEffect(() => {
    if (socialMediaContract && id) {
      fetchPostDetails();
    }
  }, [socialMediaContract, id]);

  // Fetch usernames when comments change
  useEffect(() => {
    if (comments.length > 0) {
      const addresses = comments.map(comment => comment.creator);
      fetchUsernames(addresses);
    }
  }, [comments]);

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg">
        <Navigation />
        
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neonGreen mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading post...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-darkBg">
        <Navigation />
        
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="card text-center py-8">
              <p className="text-red-500">{error || 'Post not found'}</p>
              <Link to="/" className="btn-primary mt-4 inline-block">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darkBg">
      <Navigation />
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Post
            postId={post.id}
            creator={post.creator}
            ipfsHash={post.ipfsHash}
            timestamp={post.timestamp}
            likeCount={post.likeCount}
            commentCount={post.commentCount}
            isActive={post.isActive}
            refreshPosts={fetchPostDetails}
          />
          
          <div className="card mt-6">
            <h2 className="text-xl font-bold mb-4">Comments ({post.commentCount})</h2>
            
            {account ? (
              <div className="mb-6">
                <textarea
                  className="input w-full mb-2"
                  placeholder="Add a comment..."
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={commentLoading}
                />
                
                {commentError && (
                  <div className="text-red-500 text-sm mb-2">
                    {commentError}
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button
                    className="btn-primary"
                    onClick={addComment}
                    disabled={commentLoading || !newComment.trim()}
                  >
                    {commentLoading ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-6 text-center text-gray-400">
                Connect your wallet to comment
              </div>
            )}
            
            {comments.length === 0 ? (
              <div className="text-center py-4 text-gray-400">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-t border-gray-700 pt-4">
                    <div className="flex items-center mb-2">
                      <Link to={`/profile/${comment.creator}`}>
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white">
                          {(usernames[comment.creator.toLowerCase()] || '?').charAt(0).toUpperCase()}
                        </div>
                      </Link>
                      <div className="ml-2">
                        <Link to={`/profile/${comment.creator}`} className="font-semibold hover:text-neonGreen">
                          {usernames[comment.creator.toLowerCase()] || formatAddress(comment.creator)}
                        </Link>
                        <div className="text-gray-400 text-xs">
                          {formatDate(comment.timestamp)}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-300">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
