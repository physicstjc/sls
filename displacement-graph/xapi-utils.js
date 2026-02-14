// Using a namespace to prevent global variable clashes
const XAPIUtils = {
  parameters: null, // Parameters store
  getParameters: function() {
    if (!this.parameters) { // Ensure fetch once
      var urlParams = new URLSearchParams(window.location.search);
      var endpoint = urlParams.get('endpoint');
      var auth = urlParams.get('auth');
      var agent = JSON.parse(urlParams.get('agent'));
      var stateId = urlParams.get('stateId');
      var activityId = urlParams.get('activityId');
      
      ADL.XAPIWrapper.changeConfig({
        "endpoint": endpoint + "/",
        "auth": `Basic ${auth}`
      });
      this.parameters = {
        agent,
        stateId,
        activityId
      };
    }

    return this.parameters;
  }
};

// Immediately invoke getParameters on page load
document.addEventListener("DOMContentLoaded", function() {
  XAPIUtils.getParameters(); // Fetch parameters once on load
});

function sendState(stateValue) {
  try {
    const parameters = XAPIUtils.getParameters(); // Retrieve parameters from store
    const activityId = parameters.activityId;
    const stateId = parameters.stateId;
    const agent = parameters.agent;
    const registration = null;

    ADL.XAPIWrapper.sendState(activityId, agent, stateId, registration, stateValue);
  } catch (err) {
    console.error("An error has occurred!", err);
  }
}