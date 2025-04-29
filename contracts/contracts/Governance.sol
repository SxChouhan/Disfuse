// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title Governance
 * @dev Contract for DAO-based governance of the social media platform
 */
contract Governance is Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _proposalIds;

    // Minimum time a proposal must be active before it can be executed
    uint256 public constant MIN_VOTING_PERIOD = 3 days;

    // Minimum percentage of total votes needed for a proposal to pass
    uint256 public constant QUORUM_PERCENTAGE = 10;

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        string ipfsHash; // IPFS hash containing detailed proposal information
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool canceled;
    }

    // Mapping from proposal ID to proposal details
    mapping(uint256 => Proposal) public proposals;

    // Mapping from proposal ID to voter address to whether they have voted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        string ipfsHash,
        uint256 startTime,
        uint256 endTime
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);

    constructor() {
        // In OpenZeppelin 4.9.3, the Ownable constructor automatically sets msg.sender as owner
    }

    /**
     * @dev Create a new governance proposal
     * @param _description Brief description of the proposal
     * @param _ipfsHash IPFS hash containing detailed proposal information
     * @param _votingPeriod Duration of the voting period in seconds (must be >= MIN_VOTING_PERIOD)
     */
    function createProposal(
        string memory _description,
        string memory _ipfsHash,
        uint256 _votingPeriod
    ) external returns (uint256) {
        require(_votingPeriod >= MIN_VOTING_PERIOD, "Voting period too short");

        _proposalIds.increment();
        uint256 proposalId = _proposalIds.current();

        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + _votingPeriod;

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            description: _description,
            ipfsHash: _ipfsHash,
            forVotes: 0,
            againstVotes: 0,
            startTime: startTime,
            endTime: endTime,
            executed: false,
            canceled: false
        });

        emit ProposalCreated(
            proposalId,
            msg.sender,
            _description,
            _ipfsHash,
            startTime,
            endTime
        );

        return proposalId;
    }

    /**
     * @dev Cast a vote on a proposal
     * @param _proposalId ID of the proposal
     * @param _support Whether to support the proposal or not
     */
    function castVote(uint256 _proposalId, bool _support) external {
        Proposal storage proposal = proposals[_proposalId];

        require(proposal.id != 0, "Proposal does not exist");
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.canceled, "Proposal canceled");
        require(block.timestamp <= proposal.endTime, "Voting period ended");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");

        hasVoted[_proposalId][msg.sender] = true;

        // For simplicity, each voter has a weight of 1
        // In a real implementation, this could be based on token holdings
        uint256 weight = 1;

        if (_support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }

        emit VoteCast(_proposalId, msg.sender, _support, weight);
    }

    /**
     * @dev Execute a proposal after the voting period has ended
     * @param _proposalId ID of the proposal
     */
    function executeProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];

        require(proposal.id != 0, "Proposal does not exist");
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.canceled, "Proposal canceled");
        require(block.timestamp > proposal.endTime, "Voting period not ended");

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        uint256 quorumVotes = (totalVotes * QUORUM_PERCENTAGE) / 100;

        require(totalVotes >= quorumVotes, "Quorum not reached");
        require(proposal.forVotes > proposal.againstVotes, "Proposal rejected");

        proposal.executed = true;

        emit ProposalExecuted(_proposalId);

        // In a real implementation, this would trigger the actual execution of the proposal
        // For example, calling a function on the main contract to update parameters
    }

    /**
     * @dev Cancel a proposal (only the proposer or owner can cancel)
     * @param _proposalId ID of the proposal
     */
    function cancelProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];

        require(proposal.id != 0, "Proposal does not exist");
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.canceled, "Proposal already canceled");
        require(
            msg.sender == proposal.proposer || msg.sender == owner(),
            "Not authorized"
        );

        proposal.canceled = true;

        emit ProposalCanceled(_proposalId);
    }

    /**
     * @dev Get proposal details
     * @param _proposalId ID of the proposal
     */
    function getProposal(uint256 _proposalId) external view returns (
        uint256 id,
        address proposer,
        string memory description,
        string memory ipfsHash,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 startTime,
        uint256 endTime,
        bool executed,
        bool canceled
    ) {
        Proposal memory proposal = proposals[_proposalId];
        require(proposal.id != 0, "Proposal does not exist");

        return (
            proposal.id,
            proposal.proposer,
            proposal.description,
            proposal.ipfsHash,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.startTime,
            proposal.endTime,
            proposal.executed,
            proposal.canceled
        );
    }

    /**
     * @dev Get the total number of proposals
     */
    function getTotalProposals() external view returns (uint256) {
        return _proposalIds.current();
    }
}
