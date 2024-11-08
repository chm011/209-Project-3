document.addEventListener("DOMContentLoaded", function () {
    const width = 1200;
    const height = 700;

    const svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height);
           
    const mapGroup = svg.append("g")
    .attr("id", "mapGroup");

    const projection = d3.geoMercator()
        .scale(150)
        .translate([width / 2-100, height / 1.7]);
    const path = d3.geoPath().projection(projection);

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([0, 100]);
    
    const years = [2000, 2005, 2010, 2015, 2019, 2020, 2021];
    const yearDisplay = d3.select("#year-display");

    const tooltip = d3.select("body").append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("padding", "8px")
        .style("background", "#f9f9f9")
        .style("border", "1px solid #ddd")
        .style("border-radius", "4px")
        .style("font-size", "12px");

    const nameMapping = {
        "United States": "United States of America",
        "Laos": "Lao People's Dem. Rep.",
        "Venezuela": "Venezuela (Boliv. Rep. of)",
        "Bolivia": "Bolivia (Plurin. State of)",
        "Ivory Coast": "Côte d'Ivoire",
        "Eswatini": "Swaziland",
        "Central African Rep.": "Central African Republic",
        "Cook Islands": "Cook Is.",
        "Middle Africa": "Central Africa",
        "Russia": "Russian Federation",
        "Hong Kong": "China, Hong Kong SAR",
        "Marshall Islands": "Marshall Is.",
        "Isle of Man": "Isle of Man",
        "Faeroe Islands": "Faeroe Is.",
        "Turkey": "Türkiye",
        "S. Sudan": "South Sudan",
        "Iran": "Iran (Islamic Republic of)",
        "Moldova": "Republic of Moldova",
        "Syria": "Syrian Arab Republic",
        "Tanzania": "United Rep. of Tanzania",
        "Bosnia and Herz.": "Bosnia and Herzegovina",
        "Vietnam": "Viet Nam",
        "South Korea": "Republic of Korea",
        "Dominican Rep.": "Dominican Republic",
        "Palestine": "State of Palestine",
        "Macau": "China, Macao SAR",
        "Antigua and Barb.": "Antigua and Barbuda",
        "St. Vincent & Grenadines": "Saint Vincent & Grenadines",
        "British Virgin Is.": "British Virgin Islands",
        "Cayman Is.": "Cayman Islands",
        "St. Kitts and Nevis": "Saint Kitts and Nevis",
        "Falkland Is.": "Falkland Islands (Malvinas)",
        "Sao Tome and Principe": "Sao Tome and Principe",
        "Eq. Guinea": "Equatorial Guinea",
        "Fr. Polynesia": "French Polynesia",
        "Wallis and Futuna Is.": "Wallis and Futuna Islands",
        "Solomon Is.": "Solomon Islands",
        "Marshall Is.": "Marshall Islands",
        "Netherlands": "Netherlands (Kingdom of the)",
        "Bosnia and Herz.": "Bosnia and Herzegovina",
        "Macao SAR": "China, Macao SAR",
        "Dominican Rep": "Dominican Republic",
        "St. Pierre and Miquelon": "Saint Pierre and Miquelon",
        "Saint Barthélemy": "St-Barthélemy",
        "British Virgin Islands": "British Virgin Islands",
        "Turks and Caicos Is.": "Turks and Caicos Islands",
        "United States Virgin Islands": "United States Virgin Islands",
        "Antigua and Barbuda": "Antigua and Barbuda",
        "Equatorial Guinea": "Equatorial Guinea",
        "São Tomé and Príncipe": "Sao Tome and Principe",
        "Reunion": "Réunion",
        "Moldova": "Republic of Moldova",
        "Vietnam": "Viet Nam",
        "Swaziland": "Eswatini",
        "Syria": "Syrian Arab Republic",
        "Turkey": "Türkiye",
        "South Korea": "Republic of Korea",
        "Côte d’Ivoire": "Ivory Coast",
        "Brunei": "Brunei Darussalam",
        "Tanzania": "United Rep. of Tanzania"
    
    };

//Load Data
    d3.json('custom.geo.json').then(function (geoData) {
        d3.csv('Cleaned_Internet_Data_CountriesOnly.csv').then(function (data) {

            const usageData = {};
            data.forEach(d => {
                const region = d["Region/Country/Area"].trim();
                const year = d.Year;
                const value = +d.Value;
                if (!usageData[region]) usageData[region] = {};
                usageData[region][year] = value;
            });

            function normalizeName(name) {
                return name
                    .toLowerCase()
                    .trim()
                    .normalize("NFC")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[’‘`']/g, "'")
                    .replace(/\s+/g, " ");
            }

            function logUnmatchedCsvCountries(usageData, geoData) {
                const geojsonCountries = new Set(
                    geoData.features.map(d => normalizeName(d.properties.name))
                );

                Object.keys(usageData).forEach(csvCountry => {
                    const normalizedCsvCountry = normalizeName(csvCountry);

                    if (!geojsonCountries.has(normalizedCsvCountry)) {
                        console.log(`Unmatched CSV Country: "${csvCountry}" (normalized: "${normalizedCsvCountry}")`);

                        geojsonCountries.forEach(geoCountry => {
                            if (geoCountry.includes(normalizedCsvCountry) || normalizedCsvCountry.includes(geoCountry)) {
                                console.log(`Potential close match for "${csvCountry}": "${geoCountry}"`);
                            }
                        });
                    }
                });
            }

            logUnmatchedCsvCountries(usageData, geoData);

            function updateCountryList(year) {
                const countryList = d3.select("#country-list");
                countryList.html("");

                Object.keys(usageData).forEach(country => {
                    const usage = usageData[country] ? usageData[country][year] : "Data not available";
                    const entry = countryList.append("div")
                        .attr("class", "country-entry")
                        .html(`<strong>${country}:</strong> ${usage}%`);

                    entry.on("mouseover", () => {
                        console.log(`Hovering over list country: "${country}"`);
                        const normalizedCountry = normalizeName(country);

                        d3.selectAll("path").classed("highlight", false);

                        const matchedCountry = d3.selectAll("path")
                            .filter(d => normalizeName(d.properties.name) === normalizedCountry)
                            .classed("highlight", true);

                        if (matchedCountry.empty()) {
                            console.log(`No path found for "${country}"`);
                        } else {
                            console.log(`Highlighted path for "${country}"`);
                        }
                    });

                    entry.on("mouseout", () => {
                        d3.selectAll("path").classed("highlight", false);
                    });
                });
            }

            function drawMap(year) {
                mapGroup.selectAll("path")
                    .data(geoData.features)
                    .join("path")
                    .attr("d", path)
                    .attr("fill", d => {
                        const geoRegion = d.properties.name;
                        const csvRegion = nameMapping[geoRegion] || geoRegion;
                        const usage = usageData[csvRegion] ? usageData[csvRegion][year] : null;

                        if (usage === null) {
                            console.log(`No data available for GeoJSON region: "${geoRegion}" mapped as "${csvRegion}" in year ${year}`);
                        }

                        return usage !== null ? colorScale(usage) : "#ccc";
                    })
                    .attr("stroke", "#333")
                    .attr("stroke-width", 0.5)
                    .on("mouseover", function (event, d) {
                        const region = nameMapping[d.properties.name] || d.properties.name;
                        const usage = usageData[region] ? usageData[region][year] : "Data: N/A";
                        tooltip.style("visibility", "visible")
                            .html(`<strong>${region}</strong><br>Internet Usage: ${usage}%`);
                    })
                    .on("mousemove", function (event) {
                        tooltip.style("top", (event.pageY + 10) + "px")
                               .style("left", (event.pageX + 10) + "px");
                    })
                    .on("mouseout", function () {
                        tooltip.style("visibility", "hidden");
                    });

                updateCountryList(year);
            }
    
            function logAllNames(geoData, usageData) {
                const geoNames = new Set(geoData.features.map(d => normalizeName(d.properties.name)));
                const csvNames = new Set(Object.keys(usageData).map(name => normalizeName(name)));

                console.log("All normalized GeoJSON country names:", Array.from(geoNames));
                console.log("All normalized CSV country names:", Array.from(csvNames));

                const unmatchedInGeo = Array.from(csvNames).filter(name => !geoNames.has(name));
                const unmatchedInCsv = Array.from(geoNames).filter(name => !csvNames.has(name));

                console.log("Unmatched in GeoJSON (exist in CSV but not in GeoJSON):", unmatchedInGeo);
                console.log("Unmatched in CSV (exist in GeoJSON but not in CSV):", unmatchedInCsv);
            }

            logAllNames(geoData, usageData);


            drawMap("2000");

            const slider = d3.select("#year-slider");
            slider.on("input", function () {
                const yearIndex = +this.value;
                const year = years[yearIndex];
                yearDisplay.text(`Year: ${year}`);
                drawMap(year);
        
            });
        });
    });
  

  //Legend
    const legendWidth = 20;
    const legendHeight = 200;

    const legendGroup = svg.append("g")
    .attr("id", "legendGroup")
    .attr("transform", `translate(${width - 100}, ${height / 2 - legendHeight / 2 - 60})`);

    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%"); 


    linearGradient.selectAll("stop")
    .data([
        { offset: "0%", color: colorScale(100) },
        { offset: "100%", color: colorScale(0) }
    ])
    .enter().append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);


    legendGroup.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");


    const legendScale = d3.scaleLinear()
    .domain([100, 0])  
    .range([0, legendHeight]);


    const legendAxis = d3.axisRight(legendScale)
    .ticks(5)
    .tickFormat(d => d + "%");

    legendGroup.append("g")
    .attr("class", "legend-axis")
    .attr("transform", `translate(${legendWidth}, 0)`)
    .call(legendAxis);

    });
