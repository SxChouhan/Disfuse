// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title SocialMedia
 * @dev Main contract for the decentralized social media platform
 */
contract SocialMedia is Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _postIds;
    Counters.Counter private _commentIds;

    struct Post {
        uint256 id;
        address creator;
        string ipfsHash; // IPFS CID for post content
        uint256 timestamp;
        uint256 likeCount;
        uint256 commentCount;
        bool isActive;
    }

    struct Comment {
        uint256 id;
        uint256 postId;
        address creator;
        string content;
        uint256 timestamp;
        bool isActive;
    }

    struct Profile {
        address user;
        string username;
        string bio;
        string profilePictureIpfsHash;
        uint256 followerCount;
        uint256 followingCount;
        bool isActive;
    }

    // Mappings
    mapping(uint256 => Post) private posts;
    mapping(uint256 => Comment) private comments;
    mapping(address => Profile) private profiles;
    mapping(address => mapping(uint256 => bool)) private postLikes;
    mapping(address => mapping(address => bool)) private follows;

    // Events
    event ProfileCreated(address indexed user, string username);
    event ProfileUpdated(address indexed user, string username);
    event PostCreated(uint256 indexed postId, address indexed creator, string ipfsHash);
    event PostLiked(uint256 indexed postId, address indexed liker);
    event PostUnliked(uint256 indexed postId, address indexed unliker);
    event CommentAdded(uint256 indexed commentId, uint256 indexed postId, address indexed creator);
    event Followed(address indexed follower, address indexed followed);
    event Unfollowed(address indexed follower, address indexed followed);

    constructor() {
        // In OpenZeppelin 4.9.3, the Ownable constructor automatically sets msg.sender as owner
    }

    /**
     * @dev Create a new user profile
     * @param _username The username for the profile
     * @param _bio The bio for the profile
     * @param _profilePictureIpfsHash IPFS hash of the profile picture
     */
    function createProfile(
        string memory _username,
        string memory _bio,
        string memory _profilePictureIpfsHash
    ) external {
        require(profiles[msg.sender].user == address(0), "Profile already exists");

        profiles[msg.sender] = Profile({
            user: msg.sender,
            username: _username,
            bio: _bio,
            profilePictureIpfsHash: _profilePictureIpfsHash,
            followerCount: 0,
            followingCount: 0,
            isActive: true
        });

        emit ProfileCreated(msg.sender, _username);
    }

    /**
     * @dev Update an existing user profile
     * @param _username The new username
     * @param _bio The new bio
     * @param _profilePictureIpfsHash New IPFS hash of the profile picture
     */
    function updateProfile(
        string memory _username,
        string memory _bio,
        string memory _profilePictureIpfsHash
    ) external {
        require(profiles[msg.sender].user != address(0), "Profile does not exist");
        require(profiles[msg.sender].isActive, "Profile is not active");

        Profile storage profile = profiles[msg.sender];
        profile.username = _username;
        profile.bio = _bio;
        profile.profilePictureIpfsHash = _profilePictureIpfsHash;

        emit ProfileUpdated(msg.sender, _username);
    }

    /**
     * @dev Create a new post
     * @param _ipfsHash IPFS hash of the post content
     */
    function createPost(string memory _ipfsHash) external {
        require(profiles[msg.sender].user != address(0), "Profile does not exist");
        require(profiles[msg.sender].isActive, "Profile is not active");

        _postIds.increment();
        uint256 postId = _postIds.current();

        posts[postId] = Post({
            id: postId,
            creator: msg.sender,
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp,
            likeCount: 0,
            commentCount: 0,
            isActive: true
        });

        emit PostCreated(postId, msg.sender, _ipfsHash);
    }

    /**
     * @dev Like a post
     * @param _postId ID of the post to like
     */
    function likePost(uint256 _postId) external {
        require(posts[_postId].id != 0, "Post does not exist");
        require(posts[_postId].isActive, "Post is not active");
        require(!postLikes[msg.sender][_postId], "Already liked this post");

        postLikes[msg.sender][_postId] = true;
        posts[_postId].likeCount++;

        emit PostLiked(_postId, msg.sender);
    }

    /**
     * @dev Unlike a post
     * @param _postId ID of the post to unlike
     */
    function unlikePost(uint256 _postId) external {
        require(posts[_postId].id != 0, "Post does not exist");
        require(posts[_postId].isActive, "Post is not active");
        require(postLikes[msg.sender][_postId], "Haven't liked this post");

        postLikes[msg.sender][_postId] = false;
        posts[_postId].likeCount--;

        emit PostUnliked(_postId, msg.sender);
    }

    /**
     * @dev Add a comment to a post
     * @param _postId ID of the post to comment on
     * @param _content Content of the comment
     */
    function addComment(uint256 _postId, string memory _content) external {
        require(posts[_postId].id != 0, "Post does not exist");
        require(posts[_postId].isActive, "Post is not active");
        require(profiles[msg.sender].user != address(0), "Profile does not exist");
        require(profiles[msg.sender].isActive, "Profile is not active");

        _commentIds.increment();
        uint256 commentId = _commentIds.current();

        comments[commentId] = Comment({
            id: commentId,
            postId: _postId,
            creator: msg.sender,
            content: _content,
            timestamp: block.timestamp,
            isActive: true
        });

        posts[_postId].commentCount++;

        emit CommentAdded(commentId, _postId, msg.sender);
    }

    /**
     * @dev Follow another user
     * @param _userToFollow Address of the user to follow
     */
    function followUser(address _userToFollow) external {
        require(_userToFollow != msg.sender, "Cannot follow yourself");
        require(profiles[msg.sender].user != address(0), "Your profile does not exist");
        require(profiles[_userToFollow].user != address(0), "Target profile does not exist");
        require(profiles[msg.sender].isActive, "Your profile is not active");
        require(profiles[_userToFollow].isActive, "Target profile is not active");
        require(!follows[msg.sender][_userToFollow], "Already following this user");

        follows[msg.sender][_userToFollow] = true;
        profiles[msg.sender].followingCount++;
        profiles[_userToFollow].followerCount++;

        emit Followed(msg.sender, _userToFollow);
    }

    /**
     * @dev Unfollow a user
     * @param _userToUnfollow Address of the user to unfollow
     */
    function unfollowUser(address _userToUnfollow) external {
        require(follows[msg.sender][_userToUnfollow], "Not following this user");

        follows[msg.sender][_userToUnfollow] = false;
        profiles[msg.sender].followingCount--;
        profiles[_userToUnfollow].followerCount--;

        emit Unfollowed(msg.sender, _userToUnfollow);
    }

    // Getter functions

    /**
     * @dev Get post details
     * @param _postId ID of the post
     */
    function getPost(uint256 _postId) external view returns (
        uint256 id,
        address creator,
        string memory ipfsHash,
        uint256 timestamp,
        uint256 likeCount,
        uint256 commentCount,
        bool isActive
    ) {
        Post memory post = posts[_postId];
        require(post.id != 0, "Post does not exist");

        return (
            post.id,
            post.creator,
            post.ipfsHash,
            post.timestamp,
            post.likeCount,
            post.commentCount,
            post.isActive
        );
    }

    /**
     * @dev Get profile details
     * @param _user Address of the user
     */
    function getProfile(address _user) external view returns (
        address user,
        string memory username,
        string memory bio,
        string memory profilePictureIpfsHash,
        uint256 followerCount,
        uint256 followingCount,
        bool isActive
    ) {
        Profile memory profile = profiles[_user];
        require(profile.user != address(0), "Profile does not exist");

        return (
            profile.user,
            profile.username,
            profile.bio,
            profile.profilePictureIpfsHash,
            profile.followerCount,
            profile.followingCount,
            profile.isActive
        );
    }

    /**
     * @dev Check if a user has liked a post
     * @param _user Address of the user
     * @param _postId ID of the post
     */
    function hasLiked(address _user, uint256 _postId) external view returns (bool) {
        return postLikes[_user][_postId];
    }

    /**
     * @dev Check if a user is following another user
     * @param _follower Address of the follower
     * @param _followed Address of the followed user
     */
    function isFollowing(address _follower, address _followed) external view returns (bool) {
        return follows[_follower][_followed];
    }

    /**
     * @dev Get the total number of posts
     */
    function getTotalPosts() external view returns (uint256) {
        return _postIds.current();
    }
}
