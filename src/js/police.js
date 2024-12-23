App = {
  web3Provider: null,
  contracts: {},

  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    if (typeof web3 !== "undefined") {
      console.log("not mine!");

      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      console.log("mine!");
      // set the provider you want from Web3.providers
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
        App.account = account;
        $("#account").html("<strong>Account:</strong> " + account);
        console.log(account);

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

  initContract: function () {
    $.getJSON("DIR_contract.json", function (DIRArtifact) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      App.contracts.DIR_contract = TruffleContract(DIRArtifact);

      // Set the provider for our contract
      App.contracts.DIR_contract.setProvider(App.web3Provider);
      console.log(DIRArtifact);

      // App.listenToEvents();
      // Use our contract to retrieve and mark the adopted pets
      // return App.markAdopted();
      return App.loadReports();
    });
  },

  loadReports: function () {
    App.displayAccountInfo();

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
          console.log(event.args);
          var newDiv = $("#event").clone();
          newDiv.find(".case_name").html(event.args._name);
          newDiv.find(".case_report_type").html(event.args._report_type);
          newDiv.find(".case_desc").html(event.args._desc);

          $(newDiv).css("display", "block");

          $("#events").append(newDiv);
          // App.reloadReports();
        });
    });
  },

  createReport: function () {
    console.log("in create report!");

    // retrieve details of the article
    var _reporter_name = $("#report-name").val();
    var _desc = $("#report-desc").val();
    var _report_type = $("#report-type").val();

    console.log(_reporter_name);
    console.log(_report_type);
    console.log(_desc);

    if (_reporter_name.trim() == "" || _desc.trim() == "") {
      // nothing to sell
      return false;
    }

    App.contracts.DIR_contract.deployed()
      .then(function (instance) {
        return instance.createReport(_reporter_name, _report_type, _desc, {
          from: App.account,
          gas: 500000,
        });
      })
      .then(function (result) {
        console.log(result);
        App.reloadReports();
      })
      .catch(function (err) {
        console.error(err);
      });
  },

  approve: function () {
    // $(".approve").hide();
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

// Function to approve form
App.approve = function (reportId) {
  App.contracts.DIR_contract.deployed()
    .then(function (instance) {
      return instance.approveReport(reportId, {
        from: App.account,
        gas: 1000000,
      });
    })
    .then(function (result) {
      console.log("Report approved:", result);
      App.reloadReports(); // Reload reports to show updated status
    })
    .catch(function (err) {
      console.error("Error approving report:", err);
    });
};

// Function to decline form
App.decline = function (reportId) {
  App.contracts.DIR_contract.deployed()
    .then(function (instance) {
      return instance.declineReport(reportId, {
        from: App.account,
        gas: 1000000,
      });
    })
    .then(function (result) {
      console.log("Report declined:", result);
      App.reloadReports();
    })
    .catch(function (err) {
      console.error("Error declining report:", err);
    });
};

$(function () {
  $(window).load(function () {
    App.init();
  });

  // Handle the approve button click
  $("#events").on("click", ".approve", function () {
    const reportId = $(this).data("id"); // Get the report ID (if you're using IDs)
    App.contracts.DIR_contract.deployed()
      .then(function (instance) {
        return instance.approveReport({ from: App.account, gas: 500000 }); // Call the approve function
      })
      .then(() => {
        $(this).text("Approved").prop("disabled", true);
        $(this).siblings(".decline").hide(); // Hide decline button after approval
      })
      .catch(function (err) {
        console.error(err);
      });
  });

  // Handle the decline button click
  $("#events").on("click", ".decline", function () {
    const reportId = $(this).data("id"); // Get the report ID (if you're using IDs)
    App.contracts.DIR_contract.deployed()
      .then(function (instance) {
        return instance.declineReport({ from: App.account }); // Call the decline function
      })
      .then(() => {
        $(this).text("Declined").prop("disabled", true);
        $(this).siblings(".approve").hide(); // Hide approve button after decline
      })
      .catch(function (err) {
        console.error(err);
      });
  });
});
