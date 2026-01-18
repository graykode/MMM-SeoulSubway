Module.register("MMM-SeoulSubway", {
	defaults: {
		apiKey: "",
		station: "산성",

		updateInterval: 100000,
		maxTrainsPerDirection: 2,
	},

	start() {
		this.dataByDirection = { 상행: [], 하행: [] }
		this.fetch()
		setInterval(() => this.fetch(), this.config.updateInterval)
	},

	fetch() {
		this.sendSocketNotification("GET_SUBWAY", {
			apiKey: this.config.apiKey,
			station: this.config.station,
			maxRows: this.config.maxTrainsPerDirection * 4, // 여유
		})
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "SUBWAY_DATA") {
			this.dataByDirection = this.parseXML(payload)
			this.updateDom()
		}
	},

	parseXML(xmlText) {
		const parser = new DOMParser()
		const xml = parser.parseFromString(xmlText, "text/xml")
		const rows = Array.from(xml.getElementsByTagName("row"))

		const grouped = { 상행: [], 하행: [] }

		rows.forEach(row => {
			const direction =
				row.getElementsByTagName("updnLine")[0]?.textContent
			if (!grouped[direction]) return

			const barvlDt =
				parseInt(
					row.getElementsByTagName("barvlDt")[0]?.textContent ?? "0",
					10,
				) || 0

			const arrivalTime =
				barvlDt > 0 ? `${Math.ceil(barvlDt / 60)}분 후` : null

			grouped[direction].push({
				line: row.getElementsByTagName("trainLineNm")[0]?.textContent,
				arrivalMsg:
					arrivalTime ??
					row.getElementsByTagName("arvlMsg2")[0]?.textContent,
				isLast:
					row.getElementsByTagName("lstcarAt")[0]?.textContent === "1",
			})
		})

		// 방향별 개수 제한
		Object.keys(grouped).forEach(dir => {
			grouped[dir] = grouped[dir].slice(
				0,
				this.config.maxTrainsPerDirection,
			)
		})

		return grouped
	},

	getDom() {
		const wrapper = document.createElement("div")
		wrapper.className = "small"

		const title = document.createElement("div")
		title.className = "bold"
		title.innerHTML = `🚇 ${this.config.station}역`
		wrapper.appendChild(title)

		;["상행", "하행"].forEach(direction => {
			const trains = this.dataByDirection[direction]
			if (!trains.length) return

			wrapper.appendChild(document.createElement("br"))

			const header = document.createElement("div")
			header.className = "bright"
			header.innerHTML = direction === "상행" ? "⬆ 상행" : "⬇ 하행"
			wrapper.appendChild(header)

			trains.forEach(t => {
				const row = document.createElement("div")
				row.innerHTML = `
          <span>${t.line}</span><br/>
          · ${t.arrivalMsg}${t.isLast ? " 🚨막차" : ""}
        `
				wrapper.appendChild(row)
			})
		})

		return wrapper
	},
})
