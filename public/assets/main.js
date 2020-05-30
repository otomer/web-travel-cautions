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
    "1": { color: "#163b72", description: "Exercise Normal Precautions" },
    "2": { color: "#f3c876", description: "Exercise Increased Caution" },
    "3": { color: "#f29f41", description: "Reconsider Travel" },
    "4": { color: "#ea3324", description: "Do Not Travel" },
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

  searchButton.click(function (e) {
    const searchQuery = textInput.val();
    if (!searchQuery) {
      return;
    }

    $.post(SEARCH_ENDPOINT, { search: searchQuery }).done((data) => {
      resultText.html(`${data.info}<br/><br/>${data.optional2}`);
    });
  });

  infoLabel.click(function () {
    $(".bubble-travel").toggleClass("hide");
  });
});
