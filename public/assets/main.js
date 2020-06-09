$(function () {
  const SEARCH_ENDPOINT = "/api/travel-cautions";
  const textInputId = "#autocomplete";
  const searchButtonId = "#search";
  const infoLabelId = "#info";
  const resultTextId = "#result";
  const textInput = $(textInputId);
  const searchButton = $(searchButtonId);
  const infoLabel = $(infoLabelId);
  const resultText = $(resultTextId);

  const levels = {
    "1": {
      color: "#dff0d8",
      description:
        "Usually this is an indicator that travelling in this country is relatively safe. Higher attention is advised with values > 1.",
      title: "Low Risk",
    },
    "2": {
      color: "#d9edf7",
      description:
        "Warnings often relate to specific regions within a country. However, high attention is still advised when moving around.",
      title: "Medium Risk",
    },
    "3": {
      color: "#fcf8e3",
      description:
        "Travel should be reduced to a necessary minimum and be conducted with good preparation and high attention.",
      title: "High Risk",
    },
    "4": {
      color: "#f2dede",
      description:
        "You should avoid any trips. A high warning index is a sound indicator of potential harm to your health and well-being.",
      title: "Extreme Warning",
    },
  };

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

  function newLine(text) {
    return text.replace(/(?:\r\n|\r|\n)/g, "<br>");
  }
  searchButton.click(function (e) {
    const searchQuery = textInput.val();
    if (!searchQuery) {
      return;
    }

    $.post(SEARCH_ENDPOINT, { search: searchQuery }).done((data) => {
      if (!data.travel) {
        resultText.html(`There are no results for '${searchQuery}'`);
        return;
      }

      const travel = data.travel;
      const airlines = data.airlines;

      let strAirlines = "No information available";
      if (airlines.length > 0) {
        strAirlines = "";
        airlines.forEach((v, i) => {
          strAirlines += `<br/>${i + 1}. ${v.info} (${v.published})`;
        });
      }

      resultText.html(
        `${travel.adm0_name} | ${travel.iso3} | published: ${travel.published}
        <hr/>
        ✈ Airlines information:
        ${strAirlines}
        <hr/>
        <img src="https://maps.googleapis.com/maps/api/staticmap?key=AIzaSyAUzz1zAEMeDzquaroYBj2Lvy6II8Sh5Q8&size=350x350&zoom=6&sensor=false&maptype=hybrid&markers=color:red%7C${
          travel.Y
        },${travel.X}&format=gif">
        <br/>
        (${travel.Y}, ${travel.X})
        <hr/>
        ${newLine(travel.info)}
        <hr/>${newLine(travel.optional2)}<hr/>${newLine(travel.optional3)}`
      );
    });
  });

  infoLabel.click(function () {
    $(".bubble-travel").toggleClass("hide");
  });
});
