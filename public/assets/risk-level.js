window.RISK_LEVEL = {
  1: {
    // (index value: 0 - 2.5)
    color: "#22bb33",
    description:
      "Usually this is an indicator that travelling in this country is relatively safe. Higher attention is advised with values > 1.",
    icon: "fa-check-square",
    title: "Low Risk",
  },
  2: {
    // (index value: 2.5 - 3.5)
    color: "#5bc0de",
    description:
      "Warnings often relate to specific regions within a country. However, high attention is still advised when moving around.",
    icon: "fa-info-circle",
    title: "Medium Risk",
  },
  3: {
    // (index value: 3.5 - 4.5)
    color: "#f0ad4e",
    description:
      "Travel should be reduced to a necessary minimum and be conducted with good preparation and high attention.",
    icon: "fa-exclamation-circle",
    title: "High Risk",
  },
  4: {
    // (index value: 4.5 - 5)
    color: "#bb2124",
    description:
      "You should avoid any trips. A high warning index is a sound indicator of potential harm to your health and well-being.",
    icon: "fa-exclamation-triangle",
    title: "Extreme Warning",
  },
  scoreToLevel: (score) => {
    let level = "";
    if (score <= 2.5) {
      level = "1";
    } else if (score <= 3.5) {
      level = "2";
    } else if (score <= 4.5) {
      level = "3";
    } else if (score <= 5) {
      level = "4";
    }
    return level;
  },
  generate: (level, score, simplified) => {
    const riskLevel = window.RISK_LEVEL[level];
    const inlineStyleFont = `style="color: ${riskLevel.color}"`;
    const inlineStyleBackground = `style="background-color: ${riskLevel.color}"`;
    const cls = "level-" + level;
    return `<h3 ${inlineStyleFont} class="${cls}" title="${riskLevel.description}">
              <i aria-hidden="true" class="fa ${riskLevel.icon} fa-4"></i> ${riskLevel.title}</h3>
              ${simplified ? "" : "<hr " + inlineStyleBackground + "/><p>" + riskLevel.description + "<br/><br/>Risk Score (" + score + "/5)</p>"}
              `;
  },
  generateAnchor: (level, score, name) => {
    const riskLevel = window.RISK_LEVEL[level];
    const inlineStyleFont = `style="color: ${riskLevel.color}"`;
    return `<a ${inlineStyleFont} data-name="${name}" title="${riskLevel.description}">${name}</a>`;
  }
};
