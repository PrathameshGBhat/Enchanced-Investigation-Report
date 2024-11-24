App = {
  web3Provider: null,
  contracts: {},

  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    if (typeof window.ethereum !== "undefined") {
      console.log("MetaMask detected!");
      App.web3Provider = window.ethereum;
      web3 = new Web3(window.ethereum);
      // Request account access
      window.ethereum
        .request({ method: "eth_requestAccounts" })
        .then((accounts) => {
          App.account = accounts[0];
          console.log("Connected account:", App.account);
        })
        .catch((err) => console.error("User denied account access", err));
    } else {
      console.log("MetaMask not detected, using localhost");
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://localhost:8545"
      );
      web3 = new Web3(App.web3Provider);
    }

    App.displayAccountInfo();
    return App.initContract();
  },

  displayAccountInfo: function () {
    web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        App.account = account.toLowerCase();
        $("#account").html("<strong>Account:</strong> " + account);

        if (
          App.account ===
          "0x1efccc41be5580374be3395cc5d2a94ae9943d51".toLowerCase()
        ) {
          $("#permision").html("<strong>Permission: User</strong>");
        } else if (
          App.account ===
          "0x44F2517fB0c77a0f68ac05268Bf7e502cAa1aa22".toLowerCase()
        ) {
          $("#permision").html("<strong>Permission: Police</strong> ");
        } else if (
          App.account ===
          "0x022C2e1170F9d7df8455b2f852C03F44d3AcDD53".toLowerCase()
        ) {
          $("#permision").html("<strong>Permission: Investigator</strong> ");
        }
        web3.eth.getBalance(account, function (err, balance) {
          if (err === null) {
            $("#accountBalance").html(
              "<strong>Balance:</strong> " +
                web3.fromWei(balance, "ether") +
                " ETH"
            );
          }
        });
      }
    });
  },

  checkConsole: function (id) {
    console.log("i am here in console:" + App.account);

    if (
      App.account ===
        "0x1efccc41be5580374be3395cc5d2a94ae9943d51".toLowerCase() &&
      id == 0
    ) {
      console.log("user");
      window.location.href = "/user.html";
    } else if (
      App.account ===
        "0x44F2517fB0c77a0f68ac05268Bf7e502cAa1aa22".toLowerCase() &&
      id == 1
    ) {
      console.log("police");
      window.location.href = "/police.html";
    } else if (
      App.account ===
        "0x022C2e1170F9d7df8455b2f852C03F44d3AcDD53".toLowerCase() &&
      id == 2
    ) {
      console.log("Investigator");
      window.location.href = "/investigator.html";
    } else if (id == 3) {
      console.log("Jury");
      window.location.href = "/court.html";
    } else {
      $("#error").text("You don't have permission to view that console");
    }
  },

  initContract: function () {
    $.getJSON("DIR_contract.json", function (DIRArtifact) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      App.contracts.DIR_contract = TruffleContract(DIRArtifact);

      // Set the provider for our contract
      App.contracts.DIR_contract.setProvider(App.web3Provider);
      console.log(DIRArtifact);

      App.listenToEvents();
      return App.reloadReports();
    });
  },

  reloadReports: function () {
    App.displayAccountInfo();

    App.contracts.DIR_contract.deployed()
      .then(function (instance) {
        return instance.getReport.call();
      })
      .then(function (report) {
        if (report[0] == 0x0) {
          return;
        }

        var reportRow = $("#reportRow");
        console.log("i am empty");

        reportRow.empty();

        console.log(report[0]);
        var reportTemplate = $("#listing-template");
        reportTemplate.find(".case_name").text(report[1]);
        reportTemplate.find(".case_desc").text(report[3]);
        reportTemplate.find(".case_report_type").text(report[2]);

        console.log("i am append");

        reportRow.append(reportTemplate.html());
      })
      .catch(function (err) {
        console.log(err.message);
      });
  },

  createReport: function () {
    console.log("in create report!");

    // Retrieve details of the article
    var _reporter_name = $("#report-name").val();
    var _desc = $("#report-desc").val();
    var _report_type = $("#report-type").val();

    console.log(_reporter_name);
    console.log(_report_type);
    console.log(_desc);

    // Validation check
    if (_reporter_name.trim() == "" || _desc.trim() == "") {
      alert("Please fill in all fields.");
      return false; // Exit if validation fails
    }

    // Call the smart contract method to create a report
    App.contracts.DIR_contract.deployed()
      .then(function (instance) {
        return instance.createReport(_reporter_name, _report_type, _desc, {
          from: App.account,
          gas: 500000,
        });
      })
      .then(function (result) {
        console.log(result);
        alert("Report submitted successfully!");
        // Firebase Realtime Database or Firestore Update
        const reportData = {
          reporterName: _reporter_name,
          description: _desc,
          reportType: _report_type,
          account: App.account,
          timestamp: Date.now(),
        };

        // Firebase Realtime Database Example
        firebase
          .database()
          .ref("reports/")
          .push({
            reporter_name: _reporter_name,
            report_type: _report_type,
            description: _desc,
            submitted_at: new Date().toISOString(),
          })
          .then(() => {
            console.log("Data successfully written to Firebase!");
          })
          .catch((error) => {
            console.error("Error writing to Firebase: ", error);
          });

        // Firebase Firestore Example (if using Firestore)
        /*
      firebase
        .firestore()
        .collection("reports")
        .add(reportData)
        .then((docRef) => {
          console.log("Data successfully written to Firebase Firestore with ID: ", docRef.id);
        })
        .catch((error) => {
          console.error("Error writing to Firebase Firestore: ", error);
        });
      */
        App.reloadReports(); // Reload reports after successful submission
      })
      .catch(function (err) {
        console.error(err);
        alert("Error while submitting the report.");
      });
  },

  listenToEvents: function () {
    App.contracts.DIR_contract.deployed().then(function (instance) {
      instance
        .createReportEvent(
          {},
          {
            fromBlock: 0,
            toBlock: "latest",
          }
        )
        .watch(function (err, event) {
          // $("#events").append('<li class="list-group-item">'+ event.args._name+' is for sale'+'</li>');
          App.reloadReports();
        });
    });
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
