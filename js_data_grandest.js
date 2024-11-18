        var minProd = 0;
        var maxProd = 1000;

        function getColorFromProd(prod) {
            var ratio = (prod - minProd) / (maxProd - minProd);
            var red = Math.min(255, 255 * ratio);
            var green = Math.min(255, 255 * (1 - ratio));
            return 'rgba(' + Math.round(red) + ', ' + Math.round(green) + ', 0, 0.6)';
        }

        function styleFunctionGrey(feature, isHovered) {
            var strokeWidth = isHovered ? 3 : 1;
            return new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(0, 0, 0, 0)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#888888',
                    width: strokeWidth
                })
            });
        }

        function forestStyle() {
            return new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(133, 209, 133, 0.4)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 0)',
                    width: 0
                })
            });
        }

        function waterStyle() {
            return new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#a3bff7',
                    width: 1.5
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(163, 191, 247, 0.2)'
                })
            });
        }

        var map = new ol.Map({
            target: 'map1',
            layers: [
                new ol.layer.Vector({
                    source: new ol.source.Vector({
                        url: 'forets_V2.geojson',
                        format: new ol.format.GeoJSON()
                    }),
                    style: forestStyle
                }),
                new ol.layer.Vector({
                    source: new ol.source.Vector({
                        url: 'eau.geojson',
                        format: new ol.format.GeoJSON()
                    }),
                    style: waterStyle
                }),
                new ol.layer.Vector({
                    source: new ol.source.Vector({
                        url: 'EPCI_SUM_2.geojson', 
                        format: new ol.format.GeoJSON()
                    }),
                    style: styleFunctionGrey
                }),
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([4.8690, 48.6833]),
                zoom: 8.25
            })
        });

        map.on('pointermove', function(event) {
            map.forEachFeatureAtPixel(event.pixel, function(feature) {
                if (feature !== lastFeature) {
                    lastFeature = feature;

                    var name = feature.get('nom_complet') || 'Nom non disponible';
                    console.log("Nom complet de la région survolée: " + name);

                    // Mettre à jour le tooltip avec le nom de l'EPCI
                    var tooltip = document.getElementById('tooltip');
                    tooltip.style.display = 'block';
                    tooltip.innerHTML = name;

                    map.getLayers().item(2).setStyle(function(f) {
                        return styleFunctionGrey(f, f === feature);
                    });

                    // Obtenez les données pour les graphiques
                    var productionData = [
                        { name: '2019', value: parseFloat(feature.get('prod_2019')) },
                        { name: '2020', value: parseFloat(feature.get('prod_2020')) },
                        { name: '2021', value: parseFloat(feature.get('prod_2021')) },
                        { name: '2022', value: parseFloat(feature.get('prod_2022')) }
                    ];

                    var ratioData = [
                        { name: '2019', value: parseFloat(feature.get('2019_ratioenr')) },
                        { name: '2020', value: parseFloat(feature.get('2020_ratioenr')) },
                        { name: '2021', value: parseFloat(feature.get('2021_ratioenr')) },
                        { name: '2022', value: parseFloat(feature.get('2022_ratioenr')) }
                    ];

                    var consoData = [
                        { name: '2019', value: parseFloat(feature.get('conso_2019')) },
                        { name: '2020', value: parseFloat(feature.get('conso_2020')) },
                        { name: '2021', value: parseFloat(feature.get('conso_2021')) },
                        { name: '2022', value: parseFloat(feature.get('conso_2022')) }
                    ];

                    // Mise à jour des graphiques au survol
                    drawBarChart(productionData, "#barchart");
                    drawRatioBarChart(ratioData, "#barchart-ratio");
                    drawConsoBarChart(consoData, "#barchart-conso");
                }
                return true;
            });

            // Mettre à jour la position du tooltip
            var tooltip = document.getElementById('tooltip');
            tooltip.style.left = (event.pixel[0] + 15) + 'px';
            tooltip.style.top = (event.pixel[1] + 15) + 'px';
        });

        map.on('pointerout', function() {
            lastFeature = null;
            document.getElementById('tooltip').style.display = 'none';
            map.getLayers().item(2).setStyle(function(f) {
                return styleFunctionGrey(f, false);
            });
        });

        // Fonction pour dessiner les graphiques
        function drawBarChart(data, containerId) {
            var svg = d3.select(containerId);
            svg.selectAll("*").remove();

            var margin = { top: 20, right: 30, bottom: 40, left: 40 };
            var width = 300 - margin.left - margin.right;
            var height = 200 - margin.top - margin.bottom;

            var x = d3.scaleBand().domain(data.map(d => d.name)).range([margin.left, width - margin.right]).padding(0.1);
            var y = d3.scaleLinear().domain([0, d3.max(data, d => d.value)]).nice().range([height - margin.bottom, margin.top]);

            svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x));
            svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));

            svg.selectAll(".bar").data(data).join("rect")
                .attr("class", "bar")
                .attr("x", d => x(d.name))
                .attr("y", d => y(d.value))
                .attr("height", d => y(0) - y(d.value))
                .attr("width", x.bandwidth())
                .attr("fill", "orange");
        }

        function drawRatioBarChart(data, containerId) {
            drawBarChart(data, containerId);
        }

        function drawConsoBarChart(data, containerId) {
        var svg = d3.select(containerId);
        svg.selectAll("*").remove();

        var margin = { top: 20, right: 30, bottom: 40, left: 60 };
        var width = 300 - margin.left - margin.right;
        var height = 200 - margin.top - margin.bottom;

        var maxConso = d3.max(data, d => d.value) || 1;

        var y = d3.scaleLinear()
            .domain([0, maxConso])
            .nice()
            .range([height - margin.bottom, margin.top]);

        var x = d3.scaleBand()
            .domain(data.map(d => d.name))
            .range([margin.left, width - margin.right])
            .padding(0.1);

        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x));

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).tickFormat(d3.format(".2s")));

        svg.selectAll(".bar")
            .data(data)
            .join("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.name))
            .attr("y", d => y(d.value))
            .attr("height", d => y(0) - y(d.value))
            .attr("width", x.bandwidth())
            .attr("fill", "orange");  // Harmoniser la couleur avec celle de prod et ratio

    }

        
// Centralisation des couleurs et légendes
const classStyles = {
    1: { color: 'rgba(211, 211, 211, 0.4)', legend: "Pas de spécialisation particulière." },
    2: { color: 'rgba(255, 69, 0, 0.6)', legend: "Spécialisé dans l’incinération de déchets." },
    3: { color: 'rgba(253,205,172, 0.8)', legend: "Majoritairement production d'agrocarburant." },
    4: { color: 'rgba(100, 149, 237, 0.6)', legend: "Spécialisé dans l’électricité issu de l’hydraulique renouvelable." },
    5: { color: 'rgba(0, 240, 0, 0.4)', legend: "Source Éolien prédominant." },
    6: { color: 'rgba(0, 128, 128, 0.6)', legend: "Spécialisé dans les Biogaz." },
    7: { color: 'rgba(255,127,0, 0.6)', legend: "Production EnR majoritairement issue de la géothermie." },
    8: { color: 'rgba(255, 245, 150, 0.6)', legend: "Prédominance des sources solaire thermique et pompe à chaleur." },
    default: { color: 'rgba(200, 200, 200, 0.5)', legend: "Information non disponible." }
};


// Fonction de style pour 'classe'
function class1Style(feature) {
    const class1Value = feature.get('classe');
    const { color } = classStyles[class1Value] || classStyles.default;

    return new ol.style.Style({
        fill: new ol.style.Fill({ color }),
        stroke: new ol.style.Stroke({ color: '#000', width: 1 })
    });
}

// Fonction pour déterminer le texte de la légende
function getLegendText(value) {
    return (classStyles[value] || classStyles.default).legend;
}

// Fonction de style avec survol
function styleFunctionWithHover(feature, isHovered) {
    const class1Value = feature.get('classe');
    const { color } = classStyles[class1Value] || classStyles.default;
    const strokeWidth = isHovered ? 3 : 1;

    return new ol.style.Style({
        fill: new ol.style.Fill({ color }),
        stroke: new ol.style.Stroke({ color: '#000', width: strokeWidth })
    });
}


// Initialisation de la carte 'map2'
var map2 = new ol.Map({
    target: 'map2',
    layers: [
        new ol.layer.Vector({
            source: new ol.source.Vector({
                url: 'carte2_classif.geojson',
                format: new ol.format.GeoJSON()
            }),
            style: class1Style
        })
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([5.8690, 48.6833]),
        zoom: 8.25
    })
});

// Vérification de chargement
map2.getLayers().item(0).getSource().on('error', function () {
    console.error('Erreur de chargement du fichier GeoJSON');
});

// Fonction pour générer la légende statique sans mentionner "Classe 1", "Classe 2", etc.
function generateLegend() {
    const legendContainer = document.getElementById('legend-container');
    legendContainer.innerHTML = ''; // Vider le conteneur avant de le remplir

    Object.keys(classStyles).forEach(key => {
        if (key !== 'default') { // Exclure le style par défaut
            const classInfo = classStyles[key];
            const legendItem = document.createElement('div');
            legendItem.classList.add('legend-item');

            const colorBox = document.createElement('div');
            colorBox.classList.add('legend-color-box');
            colorBox.style.backgroundColor = classInfo.color;

            const text = document.createElement('span');
            text.classList.add('legend-text');
            text.textContent = classInfo.legend; // Afficher uniquement la description

            legendItem.appendChild(colorBox);
            legendItem.appendChild(text);
            legendContainer.appendChild(legendItem);
        }
    });
}


// Appeler cette fonction immédiatement après avoir configuré la carte
generateLegend();

var lastFeature = null; // Variable pour suivre la dernière feature survolée

// Gestion des interactions pour afficher la légende dynamique
map2.on('pointermove', function (event) {
    const pixel = event.pixel;
    const feature = map2.forEachFeatureAtPixel(pixel, function (feature) {
        return feature;
    });

    if (feature && feature !== lastFeature) {
        lastFeature = feature;

        const name = feature.get('nom_complet') || 'Nom non disponible';
        const classValue = feature.get('classe');
        const legendText = getLegendText(classValue);

        // Mettre à jour la légende dynamique
        document.getElementById('legend-text').innerHTML =
            `<strong>${name}</strong><br>${legendText}`;

        // Appliquer un style au survol
        map2.getLayers().item(0).setStyle(f => styleFunctionWithHover(f, f === feature));
    } else if (!feature) {
        // Réinitialiser la légende si aucune feature n'est survolée
        lastFeature = null;
        document.getElementById('legend-text').innerHTML =
            'Survolez un EPCI pour afficher les informations.';
    }
});

// Debugging : Message pour vérifier si les GeoJSON sont bien chargés
map2.getLayers().item(0).getSource().on('featuresloadend', function () {
    console.log('GeoJSON chargé avec succès');
});



     
        // Fonction pour faire défiler vers la deuxième section
        document.getElementById('scrollButton1').addEventListener('click', function() {
            document.getElementById('section2').scrollIntoView({ behavior: 'smooth' });
        });
        
         // Fonction pour faire défiler vers la deuxième section
        document.getElementById('scrollButton2').addEventListener('click', function() {
            document.getElementById('section3').scrollIntoView({ behavior: 'smooth' });
        });

       // Fonction pour faire défiler vers le début de la page (tout en haut, où le header est visible)
        document.getElementById('scrollButton3').addEventListener('click', function() {
            // Défilement vers le tout début de la page
            window.scrollTo({
                top: 0, // Position du haut de la page
                behavior: 'smooth' // Transition fluide
            });
        });
        
        document.getElementById("settingsButton").addEventListener("click", function() {
            document.getElementById("popupOverlay").style.display = "flex";
        });
        
         document.getElementById("closePopupButton").addEventListener("click", function() {
            document.getElementById("popupOverlay").style.display = "none";
        });
        
        document.getElementById("popupOverlay").addEventListener("clcik", function(event) {
            if (event.target === this) {
                this.style.display = "none";
            }
        });

        function adjustZoomForLaptop() {
            const screenWidth = window.innerWidth;

            // Ajuster le zoom selon la largeur
            let zoomLevel = 1;

            if (screenWidth < 2000) { // Écran d'ordinateur portable
                zoomLevel = 0.8; // Dézoomer à 90%
            }

            document.body.style.zoom = zoomLevel; // Appliquer le zoom
        }

        // Appliquer la mise à jour au chargement
        window.onload = adjustZoomForLaptop;

        // Appliquer la mise à jour lors du redimensionnement
        window.onresize = adjustZoomForLaptop;

        
