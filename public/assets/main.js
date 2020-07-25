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
        <a href="#">${value}</a>
      </span>
      <a class="link" href="#"></a>
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

  $(".grid li").click((event) => {
    const _this = $(event.currentTarget);
    const countryName = _this.find("h3").text();
    search(countryName);
  });

  textInput.autocomplete({
    lookup: window.COUNTRIES,
    lookupFilter: (suggestion, originalQuery, queryLowerCase) => {
      var re = new RegExp(
        "\\b" + $.Autocomplete.utils.escapeRegExChars(queryLowerCase),
        "gi"
      );
      return re.test(suggestion.value);
    },
    onHint: (hint) => {
      $("#autocomplete-ajax-x").val(hint);
    },
    onInvalidateSelection: () => {
      $("#selction-ajax").html("You selected: none");
    },
    onSelect: (suggestion) => {
      $("#selction-ajax").html(
        "You selected: " + suggestion.value + ", " + suggestion.data
      );
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

      content = content.replace(/\*\*\*\*\*(.*?):<br>/gm, "<h3>$1</h3><hr/>");

      $(id).html(content);
    };
    $.post(SEARCH_ENDPOINT, { search: searchQuery }).done((data) => {
      if (!data.travel) {
        alert(`There are no results for '${searchQuery}'`);
        return;
      }

      const travel = data.travel;
      let airlines = data.airlines;

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
      if (airlines.length > 0) {
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

      modalWindowTitle.html(`${searchQuery} Travel Restrictions`);
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

      // resultText.html(
      //   `${travel.adm0_name} | ${travel.iso3} | published: ${travel.published}
      //   <hr/>
      //   ✈ Airlines information:
      //   ${strAirlines}
      //   <br/>
      //   <a href="http://www.google.com/maps/place/${travel.Y},${
      //     travel.X
      //   },15z">Google Maps</a>
      //   <hr/>
      //   <a href="https://earth.google.com/web/search/${travel.Y},${
      //     travel.X
      //   }/">Google Earth<a>
      //   <hr/>
      //   ${newLine(travel.info)}
      //   <hr/>${newLine(travel.optional2)}<hr/>${newLine(travel.optional3)}`
      // );
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
