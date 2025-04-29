import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { useIPFS } from '../hooks/useIPFS';

interface ProfileProps {
  address?: string; // If not provided, show current user's profile
}

interface ProfileData {
  username: string;
  bio: string;
  profilePictureCid: string;
}

const Profile: React.FC<ProfileProps> = ({ address }) => {
  const { account, socialMediaContract, isConnected } = useWeb3();
  const { fetchData, uploadProfile, getGatewayURL } = useIPFS();
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  
  // Edit form state
  const [username, setUsername] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const profileAddress = address || account;
  const isOwnProfile = !address || address === account;

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileAddress || !socialMediaContract) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        const profile = await socialMediaContract.getProfile(profileAddress);
        setFollowerCount(profile.followerCount.toNumber());
        setFollowingCount(profile.followingCount.toNumber());
        
        // Check if current user is following this profile
        if (account && !isOwnProfile) {
          const following = await socialMediaContract.isFollowing(account, profileAddress);
          setIsFollowing(following);
        }
        
        // If profile has IPFS data, fetch it
        if (profile.profilePictureIpfsHash) {
          try {
            const data = await fetchData(profile.profilePictureIpfsHash);
            setProfileData(data);
            
            // Initialize edit form
            setUsername(data.username || '');
            setBio(data.bio || '');
            if (data.profilePictureCid) {
              setProfilePicturePreview(getGatewayURL(data.profilePictureCid));
            }
          } catch (err) {
            console.error('Error fetching profile data:', err);
            setError('Failed to load profile data');
          }
        } else {
          // No IPFS data yet
          setProfileData({
            username: profile.username,
            bio: '',
            profilePictureCid: ''
          });
          setUsername(profile.username);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Profile not found');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileAddress, socialMediaContract, account, isOwnProfile, fetchData, getGatewayURL]);

  // Handle profile picture selection
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save profile changes
  const saveProfile = async () => {
    if (!isConnected || !account || !socialMediaContract) {
      setSubmitError('Please connect your wallet first');
      return;
    }
    
    if (!username.trim()) {
      setSubmitError('Username is required');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Upload profile data to IPFS
      const ipfsHash = await uploadProfile(username, bio, profilePicture || undefined);
      
      // Update profile on blockchain
      const tx = await socialMediaContract.updateProfile(username, bio, ipfsHash);
      await tx.wait();
      
      // Update local state
      setIsEditing(false);
      
      // Refresh profile data
      const data = await fetchData(ipfsHash);
      setProfileData(data);
    } catch (err) {
      console.error('Error updating profile:', err);
      setSubmitError('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create new profile
  const createProfile = async () => {
    if (!isConnected || !account || !socialMediaContract) {
      setSubmitError('Please connect your wallet first');
      return;
    }
    
    if (!username.trim()) {
      setSubmitError('Username is required');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Upload profile data to IPFS
      const ipfsHash = await uploadProfile(username, bio, profilePicture || undefined);
      
      // Create profile on blockchain
      const tx = await socialMediaContract.createProfile(username, bio, ipfsHash);
      await tx.wait();
      
      // Update local state
      setIsEditing(false);
      
      // Refresh profile data
      const data = await fetchData(ipfsHash);
      setProfileData(data);
    } catch (err) {
      console.error('Error creating profile:', err);
      setSubmitError('Failed to create profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Follow/unfollow user
  const toggleFollow = async () => {
    if (!isConnected || !account || !socialMediaContract || !profileAddress) {
      return;
    }
    
    try {
      if (isFollowing) {
        await socialMediaContract.unfollowUser(profileAddress);
        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
      } else {
        await socialMediaContract.followUser(profileAddress);
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error following/unfollowing user:', err);
    }
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gray-600 mb-4"></div>
          <div className="h-6 w-32 bg-gray-600 rounded mb-2"></div>
          <div className="h-4 w-48 bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-red-500 text-center">
          {error}
        </div>
        {isOwnProfile && (
          <div className="mt-4 text-center">
            <button
              className="btn-primary"
              onClick={() => setIsEditing(true)}
            >
              Create Profile
            </button>
          </div>
        )}
      </div>
    );
  }

  if (isEditing || !profileData) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-center">
          {profileData ? 'Edit Profile' : 'Create Profile'}
        </h2>
        
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center">
              {profilePicturePreview ? (
                <img 
                  src={profilePicturePreview} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl text-white">
                  {username.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>
            <label 
              htmlFor="profile-picture"
              className="absolute bottom-0 right-0 bg-neonGreen text-darkBg rounded-full p-2 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </label>
            <input
              type="file"
              id="profile-picture"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="hidden"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input w-full"
            placeholder="Enter your username"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-400 mb-2">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="input w-full"
            rows={3}
            placeholder="Tell us about yourself"
          />
        </div>
        
        {submitError && (
          <div className="text-red-500 text-sm mb-4">
            {submitError}
          </div>
        )}
        
        <div className="flex justify-end space-x-4">
          {profileData && (
            <button
              className="btn-secondary"
              onClick={() => setIsEditing(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          
          <button
            className="btn-primary"
            onClick={profileData ? saveProfile : createProfile}
            disabled={isSubmitting || !username.trim()}
          >
            {isSubmitting ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center mb-4">
          {profileData.profilePictureCid ? (
            <img 
              src={getGatewayURL(profileData.profilePictureCid)} 
              alt={profileData.username} 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl text-white">
              {profileData.username.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        
        <h1 className="text-2xl font-bold mb-1">
          {profileData.username}
        </h1>
        
        <div className="text-gray-400 mb-2">
          {profileAddress && formatAddress(profileAddress)}
        </div>
        
        {profileData.bio && (
          <p className="text-center text-gray-300 mb-4">
            {profileData.bio}
          </p>
        )}
        
        <div className="flex space-x-6 mb-4">
          <div className="text-center">
            <div className="font-bold">{followerCount}</div>
            <div className="text-gray-400 text-sm">Followers</div>
          </div>
          
          <div className="text-center">
            <div className="font-bold">{followingCount}</div>
            <div className="text-gray-400 text-sm">Following</div>
          </div>
        </div>
        
        {isOwnProfile ? (
          <button
            className="btn-secondary"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>
        ) : (
          <button
            className={isFollowing ? 'btn-secondary' : 'btn-primary'}
            onClick={toggleFollow}
          >
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Profile;
