pragma solidity ^0.5.16;

contract DIR_contract {
    address public reporter;
    string public name;
    string public report_type;
    string public desc;

    enum Status { Pending, Approved, Declined }
    Status public report_status;

    // Events for creating, approving, and declining reports
    event createReportEvent(address indexed _reporter, string _name, string _report_type, string _desc);
    event reportApproved(address indexed _approver);
    event reportDeclined(address indexed _decliner);

    // Function to create a report
    function createReport(string memory _name, string memory _report_type, string memory _desc) public {
        reporter = msg.sender;
        name = _name;
        report_type = _report_type;
        desc = _desc;
        report_status = Status.Pending;
        emit createReportEvent(reporter, name, report_type, desc);
    }

    // Function to get the report details
    function getReport() public view returns (
        address _reporter, string memory _name, string memory _report_type, string memory _desc, Status _status
    ) {
        return (reporter, name, report_type, desc, report_status);
    }

    // Function to approve a report
    function approveReport() public {
        require(report_status == Status.Pending, "Report already processed");
        report_status = Status.Approved;
        emit reportApproved(msg.sender);
    }

    // Function to decline a report
    function declineReport() public {
        require(report_status == Status.Pending, "Report already processed");
        report_status = Status.Declined;
        emit reportDeclined(msg.sender);
    }
}
