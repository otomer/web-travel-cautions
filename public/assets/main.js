const newLine = (text) => text.replace(/(?:\r\n|\r|\n)/g, "<br>");

$(() => {
  const SEARCH_ENDPOINT = "/api/travel-cautions";
  const SEARCH_HISTORY = ["Brazil", "China", "Israel"];

  // Selectors
  const textInputId = "#autocomplete";
  const searchButtonId = "#search";
  const resultTextId = "#result";
  const modalOpenClass = ".md-trigger";
  const modalCloseClass = ".md-close";
  const modalWindowClass = ".md-modal";
  const modalHideClassName = "md-show";
  const noScrollClassName = "noscroll";
  const modalWindowTitleId = "#modalTitle";
  const searchHistoryClass = ".search-history";
  const favDestinationsClass = ".fav-destinations";

  // DOM Elements
  const textInput = $(textInputId);
  const searchButton = $(searchButtonId);
  const resultText = $(resultTextId);
  const modalWindow = $(modalWindowClass);
  const modalWindowTitle = $(modalWindowTitleId);
  const searchHistory = $(searchHistoryClass);

  const hRenderItem = (value) => {
    searchHistory.prepend(`<li>
      <span class="text">
        <a href="javascript:void(0);">${value}</a>
      </span>
      <a class="link" href="javascript:void(0);"></a>
    </li>`);
  };
  const hFetch = (array) => {
    array.forEach((value, index) => {
      hRenderItem(value);
    });
  };
  const hPush = (searchQuery) => {
    searchHistory.find("li:last-child").remove();
    hRenderItem(searchQuery);
  };

  // Search History
  hFetch(SEARCH_HISTORY);
  $("body").on("click", ".search-history li", (event) => {
    const _this = $(event.currentTarget);
    const countryName = _this.find(".text a").text();
    search(countryName);
  });

  $(`${favDestinationsClass} li`).click((event) => {
    const _this = $(event.currentTarget);
    const countryName = _this.find("h3").text();
    search(countryName);
  });

  textInput.autocomplete({
    lookup: Object.keys(window.COUNTRIES).sort(),
    lookupFilter: (suggestion, originalQuery, queryLowerCase) => {
      var re = new RegExp(
        "\\b" + $.Autocomplete.utils.escapeRegExChars(queryLowerCase),
        "gi"
      );
      return re.test(suggestion.value);
    },
  });

  const modalHide = () => {
    $("body").removeClass(noScrollClassName);
    modalWindow.removeClass(modalHideClassName);
    textInput.val("");
  };

  const modalShow = () => {
    $("body").addClass(noScrollClassName);
    modalWindow.addClass(modalHideClassName);
  };
  $(modalOpenClass).on("click", () => modalShow());
  $(modalCloseClass).on("click", () => modalHide());

  $(".js-anchor-link").click(function (e) {
    e.preventDefault();
    var target = $($(this).attr("href"));
    if (target.length) {
      var scrollTo = target.offset().top;
      $("body, html").animate({ scrollTop: scrollTo + "px" }, 800);
    }
  });

  const search = (searchQuery) => {
    const addSection = (id, title, content, icon) => {
      content = `<h3><i aria-hidden="true" class="fa ${icon} fa-4"></i> ${title}</h3><hr/><p>${
        content.trim().length > 0
          ? newLine(content)
          : "No information available"
      }</p>`;

      content = content.replace(/\*\*\*\*\*(.*?):/gm, "<h3>$1</h3>");

      $(id).html(content);
    };
    $.post(SEARCH_ENDPOINT, { search: searchQuery }).done((data) => {
      if (!data.travel) {
        alert(`There are no results for '${searchQuery}'`);
        return;
      }

      const travel = data.travel;
      let airlines = data.airlines;
      const advisory = data.advisory && data.advisory.advisory;

      const convertStrToDate = (str) => {
        var dateParts = str.split(".");

        // month is 0-based, that's why we need dataParts[1] - 1
        var dateObject = new Date(
          +dateParts[2],
          dateParts[1] - 1,
          +dateParts[0]
        );

        return dateObject;
      };

      let strAirlines = "";
      if (airlines && airlines.length > 0) {
        airlines = airlines.sort(function (a, b) {
          var dateA = new Date(convertStrToDate(a.published)),
            dateB = new Date(convertStrToDate(b.published));
          return dateB - dateA;
        });

        airlines.forEach((v, i) => {
          if (v && v.info) {
            strAirlines += `<tr><td>${v.info}</td><td>${v.published}</td></tr>`;
          }
        });
      }
      if (strAirlines) {
        strAirlines = `<table>${strAirlines}</table>`;
      }

      if (advisory) {
        let level = "";
        if (advisory.score <= 2.5) {
          level = "1";
        } else if (advisory.score <= 3.5) {
          level = "2";
        } else if (advisory.score <= 4.5) {
          level = "3";
        } else if (advisory.score <= 5) {
          level = "4";
        }
        if (level) {
          const riskLevel = window.RISK_LEVEL[level];
          const $advisoryLevel = $("#advisory-level");
          const inlineStyleFont = `style="color: ${riskLevel.color}"`;
          const inlineStyleBackground = `style="background-color: ${riskLevel.color}"`;

          $advisoryLevel.addClass("level-" + level);
          $advisoryLevel.html(
            `<h3 ${inlineStyleFont}><i aria-hidden="true" class="fa ${riskLevel.icon} fa-4"></i> ${riskLevel.title}</h3><hr ${inlineStyleBackground}/><p>
            ${riskLevel.description}
            <br/><br/>  
            Risk Score (${advisory.score}/5)
            </p>`
          );
        }
      }
      const country = window.COUNTRIES[searchQuery];
      let img = "";
      if (country.iso2 && country.iso2.indexOf(",") === -1) {
        img = `<img src="https://www.travel-advisory.info/_resources/flags/h14/${country.iso2.toLowerCase()}.png"/>`;
      }
      modalWindowTitle.html(`${img} ${searchQuery} Travel Restrictions`);
      addSection(
        "#self-quarantine",
        "Self-Quarantine",
        travel.optional2,
        "fa-home"
      );
      addSection("#airlines", "Airlines Information", strAirlines, "fa-plane");
      addSection(
        "#certificate",
        "Health Certification Requirement",
        travel.optional3,
        "fa-medkit"
      );
      addSection(
        "#general-info",
        "General Information",
        travel.info,
        "fa-info-circle"
      );

      modalShow();
    });
  };

  searchButton.click(function (e) {
    const searchQuery = textInput.val();
    if (!searchQuery) {
      return;
    }

    search(searchQuery);
    hPush(searchQuery);
  });
});
