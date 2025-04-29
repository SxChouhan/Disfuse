import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import CreatePost from '../components/CreatePost';

const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();

  const handlePostCreated = () => {
    // Redirect to home page after post is created
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-darkBg">
      <Navigation />
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Create Post</h1>
          
          <CreatePost onPostCreated={handlePostCreated} />
        </div>
      </div>
    </div>
  );
};

export default CreatePostPage;
