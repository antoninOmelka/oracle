require([
  "ojs/ojcore",
  "knockout",
  "jquery",
  "ojs/ojknockout",
  "ojs/ojmodel",
  "promise",
  "ojs/ojtable",
  "ojs/ojcheckboxset",
  "ojs/ojchart",
  "ojs/ojarraytabledatasource",
  "ojs/ojcollectiontabledatasource"
], function(oj, ko, $) {
  var projectCount = 0;
  var employeeCount = 0;
  var hazardCount = 0;
  var locationCount = 0;

  var enabled = 0;
  var disabled = 0;

  function viewModel() {
    var self = this;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        var myObj = JSON.parse(this.responseText);

        for (var i in myObj) {
          self.deptArray.push({
            Selected: ko.observable([]),
            Name: `${myObj[i].name}`,
            Type: `${myObj[i].type}`
          });
          disabled++;
        }
        chartEnabled.syncChart();
      }
    };
    xmlhttp.open("GET", "sample.json", true);
    xmlhttp.send();

    self.deptArray = [
      {
        Selected: ko.observable([]),
        Name: "Employee fallen over",
        Type: "Employee"
      },
      { Selected: ko.observable([]), Name: "Broken floor", Type: "Hazard" },
      {
        Selected: ko.observable([]),
        Name: "Same employee fallen over again",
        Type: "Employee"
      },
      { Selected: ko.observable([]), Name: "Reduce falls", Type: "Project" }
    ];
    self.datasource = new oj.ArrayTableDataSource(self.deptArray, {
      idAttribute: "Name"
    });
    self.columnArray = [
      {
        renderer: oj.KnockoutTemplateUtils.getRenderer("checkbox_tmpl", true),
        headerStyle: "font-weight: bold;",
        headerText: "Enabled",
        id: "column1"
      },
      {
        headerText: "Name",
        headerStyle: "font-weight: bold;",
        field: "Name",
        id: "column2"
      },
      {
        headerText: "Type",
        headerStyle: "font-weight: bold;",
        field: "Type",
        id: "column3"
      }
    ];
    disabled += self.deptArray.length;

    self.selectionListener = function(event) {
      var data = event.detail;

      if (data != null) {
        var selectionObj = data.value;
        var totalSize = self.datasource.totalSize();

        for (var i = 0; i < totalSize; i++) {
          employeeCount = 0;
          hazardCount = 0;
          projectCount = 0;
          locationCount = 0;

          disabled = totalSize - enabled;
          enabled = 0;

          self.datasource.at(i).then(function(row) {
            var foundInSelection = false;
            if (selectionObj) {
              for (var j = 0; j < selectionObj.length; j++) {
                var range = selectionObj[j];
                var startIndex = range.startIndex;
                var endIndex = range.endIndex;

                if (startIndex != null && startIndex.row != null) {
                  if (
                    row.index >= startIndex.row &&
                    row.index <= endIndex.row
                  ) {
                    row.data.Selected(["checked"]);
                    foundInSelection = true;

                    enabled = selectionObj.length;
                    disabled = totalSize - enabled;

                    if (row.data.Type === "Employee") {
                      employeeCount++;
                    }
                    if (row.data.Type === "Hazard") {
                      hazardCount++;
                    }
                    if (row.data.Type === "Location") {
                      locationCount++;
                    }
                    if (row.data.Type === "Project") {
                      projectCount++;
                    }
                  }
                }
              }
            }
            if (!foundInSelection) {
              row.data.Selected([]);
            }

            chartType.syncChart();
            chartEnabled.syncChart();
          });
        }
      }
    };

    var self = this;
    self.syncCheckboxes = function(event) {
      event.stopPropagation();

      setTimeout(function() {
        // sync the checkboxes with selection obj
        var selectionObj = [];
        var totalSize = self.datasource.totalSize();

        for (var i = 0; i < totalSize; i++) {
          self.datasource.at(i).then(function(row) {
            if (
              row.data.Selected().length > 0 &&
              row.data.Selected()[0] == "checked"
            ) {
              selectionObj.push({
                startIndex: { row: row.index },
                endIndex: { row: row.index }
              });
            }

            if (row.index === totalSize - 1) {
              table.selection = selectionObj;
            }
          });
        }
      }, 0);
    };
  }

  function TypeChartModel() {
    var self = this;

    var pieSeries = [
      {
        name: "Project " + projectCount,
        color: "#eb8146",
        items: [projectCount]
      },
      {
        name: "Employee " + employeeCount,
        color: "#845199",
        items: [employeeCount]
      },
      {
        name: "Location " + locationCount,
        color: "#42ae86",
        items: [locationCount]
      },
      { name: "Hazard " + hazardCount, color: "#ffff33", items: [hazardCount] }
    ];

    this.pieSeriesValue = ko.observableArray(pieSeries);

    self.syncChart = function(event) {
      pieSeries = [
        {
          name: "Project " + projectCount,
          color: "#eb8146",
          items: [projectCount]
        },
        {
          name: "Employee " + employeeCount,
          color: "#845199",
          items: [employeeCount]
        },
        {
          name: "Location " + locationCount,
          color: "#42ae86",
          items: [locationCount]
        },
        {
          name: "Hazard " + hazardCount,
          color: "#ffff33",
          items: [hazardCount]
        }
      ];

      document.getElementById("pieChartType").series = pieSeries;
    };
  }

  function ChartModel() {
    var self = this;

    var pieSeries = [
      { name: "ENABLED " + enabled, color: "#38a0d9", items: [enabled] },
      { name: "DISABLED " + disabled, color: "#a7aaa9", items: [disabled] }
    ];

    this.pieSeriesValue = ko.observableArray(pieSeries);

    self.syncChart = function(event) {
      pieSeries = [
        { name: "ENABLED " + enabled, color: "#38a0d9", items: [enabled] },
        { name: "DISABLED " + disabled, color: "#a7aaa9", items: [disabled] }
      ];

      document.getElementById("pieChartEnabled").series = pieSeries;
    };
  }

  var vm = new viewModel();
  var chartEnabled = new ChartModel();
  var chartType = new TypeChartModel();

  $(document).ready(function() {
    var table = document.getElementById("table");
    ko.applyBindings(chartEnabled, document.getElementById("pieChartEnabled"));
    ko.applyBindings(chartType, document.getElementById("pieChartType"));
    ko.applyBindings(vm, table);
    table.addEventListener("selectionChanged", vm.selectionListener);
    $("#table").on("click", ".oj-checkboxset", vm.syncCheckboxes);
  });
});
