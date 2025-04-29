import { useState } from 'react';
import { 
  uploadFileToIPFS, 
  uploadJSONToIPFS, 
  uploadPostToIPFS, 
  uploadProfileToIPFS,
  fetchFromIPFS,
  getIPFSGatewayURL
} from '../utils/ipfs';

interface UseIPFSReturn {
  uploadFile: (file: File) => Promise<string>;
  uploadJSON: (data: any) => Promise<string>;
  uploadPost: (content: string, imageFile?: File) => Promise<string>;
  uploadProfile: (username: string, bio: string, profilePictureFile?: File) => Promise<string>;
  fetchData: (cid: string) => Promise<any>;
  getGatewayURL: (cid: string, filename?: string) => string;
  loading: boolean;
  error: string | null;
}

export const useIPFS = (): UseIPFSReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      const cid = await uploadFileToIPFS(file);
      return cid;
    } catch (err) {
      setError(err.message || 'Failed to upload file to IPFS');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadJSON = async (data: any): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      const cid = await uploadJSONToIPFS(data);
      return cid;
    } catch (err) {
      setError(err.message || 'Failed to upload JSON to IPFS');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadPost = async (content: string, imageFile?: File): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      const cid = await uploadPostToIPFS(content, imageFile);
      return cid;
    } catch (err) {
      setError(err.message || 'Failed to upload post to IPFS');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadProfile = async (
    username: string,
    bio: string,
    profilePictureFile?: File
  ): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      const cid = await uploadProfileToIPFS(username, bio, profilePictureFile);
      return cid;
    } catch (err) {
      setError(err.message || 'Failed to upload profile to IPFS');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (cid: string): Promise<any> => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchFromIPFS(cid);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch data from IPFS');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getGatewayURL = (cid: string, filename?: string): string => {
    return getIPFSGatewayURL(cid, filename);
  };

  return {
    uploadFile,
    uploadJSON,
    uploadPost,
    uploadProfile,
    fetchData,
    getGatewayURL,
    loading,
    error,
  };
};
