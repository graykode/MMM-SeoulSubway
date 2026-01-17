const NodeHelper = require("node_helper")
const request = require("request")

module.exports = NodeHelper.create({
	start() {
		console.log("MMM-SeoulSubway helper started")
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "GET_SUBWAY") {
			this.fetchSubway(payload)
		}
	},

	fetchSubway({ apiKey, station, maxRows }) {
		const rows = maxRows ?? 10
		const encodedStation = encodeURIComponent(station)

		const url = `http://swopenapi.seoul.go.kr/api/subway/${apiKey}/xml/realtimeStationArrival/0/${rows}/${encodedStation}`

		request(url, (err, res, body) => {
			if (err || res.statusCode !== 200) {
				this.sendSocketNotification("SUBWAY_ERROR", {
					error: err?.message ?? `status ${res.statusCode}`,
				})
				return
			}

			this.sendSocketNotification("SUBWAY_DATA", body)
		})
	},
})
