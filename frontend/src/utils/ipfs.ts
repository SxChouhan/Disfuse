// Pinata API configuration
const PINATA_API_KEY = process.env.VITE_PINATA_API_KEY || "your_pinata_api_key";
const PINATA_API_SECRET = process.env.VITE_PINATA_API_SECRET || "your_pinata_api_secret";
const PINATA_JWT = process.env.VITE_PINATA_JWT || "your_pinata_jwt";

// Base URL for Pinata API
const PINATA_API_URL = "https://api.pinata.cloud";

// Check if Pinata credentials are available
const isPinataConfigured = () => {
  return PINATA_API_KEY !== "your_pinata_api_key" &&
         PINATA_API_SECRET !== "your_pinata_api_secret" &&
         PINATA_JWT !== "your_pinata_jwt";
};

// Upload a file to IPFS using Pinata
export const uploadFileToIPFS = async (file: File): Promise<string> => {
  try {
    // If Pinata is not configured, return a mock CID
    if (!isPinataConfigured()) {
      console.warn('Pinata API credentials not found. Using mock IPFS functionality.');
      return 'QmExample123456789';
    }

    // Create form data for the file
    const formData = new FormData();
    formData.append('file', file);

    // Add metadata
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        app: 'disfuse',
        type: 'file',
        timestamp: Date.now().toString()
      }
    });
    formData.append('pinataMetadata', metadata);

    // Add options
    const options = JSON.stringify({
      cidVersion: 1
    });
    formData.append('pinataOptions', options);

    // Upload to Pinata
    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to upload to Pinata: ${response.statusText}`);
    }

    const result = await response.json();
    return result.IpfsHash;
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw new Error('Failed to upload file to IPFS');
  }
};

// Upload JSON data to IPFS using Pinata
export const uploadJSONToIPFS = async (data: any): Promise<string> => {
  try {
    // If Pinata is not configured, return a mock CID
    if (!isPinataConfigured()) {
      console.warn('Pinata API credentials not found. Using mock IPFS functionality.');
      return 'QmExample123456789';
    }

    // Prepare the JSON data
    const jsonData = {
      pinataContent: data,
      pinataMetadata: {
        name: 'disfuse-data.json',
        keyvalues: {
          app: 'disfuse',
          type: 'json',
          timestamp: Date.now().toString()
        }
      },
      pinataOptions: {
        cidVersion: 1
      }
    };

    // Upload to Pinata
    const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      body: JSON.stringify(jsonData)
    });

    if (!response.ok) {
      throw new Error(`Failed to upload to Pinata: ${response.statusText}`);
    }

    const result = await response.json();
    return result.IpfsHash;
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error);
    throw new Error('Failed to upload JSON to IPFS');
  }
};

// Upload post data to IPFS
export const uploadPostToIPFS = async (
  content: string,
  imageFile?: File
): Promise<string> => {
  try {
    let imageCid = '';

    // Upload image if provided
    if (imageFile) {
      imageCid = await uploadFileToIPFS(imageFile);
    }

    // Create post data
    const postData = {
      content,
      imageCid,
      timestamp: Date.now(),
    };

    // Upload post data
    return await uploadJSONToIPFS(postData);
  } catch (error) {
    console.error('Error uploading post to IPFS:', error);
    throw new Error('Failed to upload post to IPFS');
  }
};

// Upload profile data to IPFS
export const uploadProfileToIPFS = async (
  username: string,
  bio: string,
  profilePictureFile?: File
): Promise<string> => {
  try {
    let profilePictureCid = '';

    // Upload profile picture if provided
    if (profilePictureFile) {
      profilePictureCid = await uploadFileToIPFS(profilePictureFile);
    }

    // Create profile data
    const profileData = {
      username,
      bio,
      profilePictureCid,
      timestamp: Date.now(),
    };

    // Upload profile data
    return await uploadJSONToIPFS(profileData);
  } catch (error) {
    console.error('Error uploading profile to IPFS:', error);
    throw new Error('Failed to upload profile to IPFS');
  }
};

// Get IPFS gateway URL for a CID
export const getIPFSGatewayURL = (cid: string, filename?: string): string => {
  if (!cid) return '';

  // Use Pinata gateway if configured, otherwise fallback to public gateway
  const gateway = isPinataConfigured()
    ? `https://gateway.pinata.cloud/ipfs/`
    : 'https://ipfs.io/ipfs/';

  return filename ? `${gateway}${cid}/${filename}` : `${gateway}${cid}`;
};

// Fetch data from IPFS
export const fetchFromIPFS = async (cid: string): Promise<any> => {
  // If CID is empty or matches our example CID, return mock data
  if (!cid || cid === 'QmExample123456789') {
    console.warn('Using mock data for IPFS fetch');
    return {
      content: 'This is a mock post content for development.',
      imageCid: '',
      timestamp: Date.now() - 3600000, // 1 hour ago
      username: 'MockUser',
      bio: 'This is a mock user bio for development.',
      profilePictureCid: ''
    };
  }

  try {
    // Get the gateway URL for the CID
    const url = getIPFSGatewayURL(cid);

    // Add timeout to fetch to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    // Set up headers
    const headers: HeadersInit = {
      'Accept': 'application/json'
    };

    // If using Pinata and we have a JWT, add it to the headers
    if (isPinataConfigured() && url.includes('gateway.pinata.cloud')) {
      headers['Authorization'] = `Bearer ${PINATA_JWT}`;
    }

    // Fetch the data
    const response = await fetch(url, {
      signal: controller.signal,
      headers
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching from IPFS:', error);

    // Return mock data as fallback
    return {
      content: 'Failed to load content from IPFS. This is fallback content.',
      imageCid: '',
      timestamp: Date.now(),
      username: 'User',
      bio: 'Bio information unavailable',
      profilePictureCid: ''
    };
  }
};
