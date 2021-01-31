const newLine = (text) => text.replace(/(?:\r\n|\r|\n)/g, "<br>");

$(() => {
  const SEARCH_ENDPOINT = "/api/travel-cautions";
  const DESTINATIONS_ENDPOINT = "/api/destinations";
  const COUNTRIES_ENDPOINT = "/api/countries";
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
  const favDestinationsDescriptionClass = ".destinations-description";

  // DOM Elements
  const textInput = $(textInputId);
  const searchButton = $(searchButtonId);
  const resultText = $(resultTextId);
  const modalWindow = $(modalWindowClass);
  const modalWindowTitle = $(modalWindowTitleId);
  const searchHistory = $(searchHistoryClass);

  let countriesLoaded = false;

  function setIntervalX(callback, delay, repetitions) {
    var x = 0;
    var intervalID = window.setInterval(function () {
      if (++x === repetitions || countriesLoaded) {
        window.clearInterval(intervalID);
      } else {
        callback();
      }
    }, delay);
  }

  setIntervalX(
    function () {
      $.get(COUNTRIES_ENDPOINT, function (data) {
        if (data && Object.keys(data).length > 0) {
          countriesLoaded = true;
          console.log("Refresh countries list");
          window.COUNTRIES = data.countries;
        }
      });
    },
    1000,
    5
  );

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

  const destinationsIso2 = [];
  $(favDestinationsClass + " h3").each(function (index) {
    const iso2 = $(this).attr("data-iso2");
    if (iso2) {
      destinationsIso2.push(iso2);
    }
  });

  if (destinationsIso2.length) {
    $.post(DESTINATIONS_ENDPOINT, { iso2: destinationsIso2.join(",") }).done(
      (data) => {
        if (data && data.destinations && data.destinations) {
          const dest = data && data.destinations && data.destinations;
          if (dest.requested) {
            Object.keys(dest.requested).forEach((key) => {
              const domElement = $(
                favDestinationsClass + " h3[data-iso2=" + key + "]"
              );
              if (domElement.length) {
                const score = dest.requested[key].advisory.score;
                const level = window.RISK_LEVEL.scoreToLevel(
                  dest.requested[key].advisory.score
                );
                const riskDomElement = window.RISK_LEVEL.generate(
                  level,
                  score,
                  true
                );
                domElement.html(domElement.text() + riskDomElement);
              }
            });
          }
          if (dest.random) {
            const links = [];
            Object.keys(dest.random).forEach((key) => {
              const obj = dest.random[key];
              links.push(
                window.RISK_LEVEL.generateAnchor(
                  key,
                  obj.advisory.score,
                  obj.name
                )
              );
            });
            $(favDestinationsDescriptionClass).append(
              "<p>Check also: " + links.join(", ") + "</p>"
            );
            $(`${favDestinationsDescriptionClass} a`).click((event) => {
              const _this = $(event.currentTarget);
              const countryName = _this.attr("data-name");
              search(countryName);
            });
          }
        }
      }
    );
  }

  // Search History
  hFetch(SEARCH_HISTORY);
  $("body").on("click", ".search-history li", (event) => {
    const _this = $(event.currentTarget);
    const countryName = _this.find(".text a").text();
    search(countryName);
  });

  $(`${favDestinationsClass} li`).click((event) => {
    const _this = $(event.currentTarget);
    const countryName = _this.find("h3").attr("data-name");
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
        let level = window.RISK_LEVEL.scoreToLevel(advisory.score);
        if (level) {
          const riskDomElement = window.RISK_LEVEL.generate(
            level,
            advisory.score
          );
          const $advisoryLevel = $("#advisory-level");
          $advisoryLevel.html(riskDomElement);
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
