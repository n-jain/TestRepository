angular.module('test', ['bluvueSheet'])
    .controller('testController', ['$scope', '$q',
        function ($scope, $q) {
            'use strict';

            var sheetsLoadDelay = 2000;
            var project = function (id, name) {
                this.id = id;
                this.name = name;
                this._sheets = [];

                Object.defineProperty(this, "sheets", {
                    get: function () {
                        var t = this;
                        if (t._sheets.length === 0) {
                            setTimeout(function () {
                                sheets.forEach(function (sheet) {
                                    if (sheet.projectId !== t.id) return true;
                                    t._sheets.push(sheet);
                                    return true;
                                });

                                console.log("sheets loaded for project: ", t.name);
                            }, sheetsLoadDelay);
                        }

                        return t._sheets;
                    }
                });
            };
            
            var projects = [
                new project("project_1", "Project 1"),
                new project("project_2", "Project 2")
            ];

            var sheets = [
                {
                    name: 'Sheet 1!',
                    notes: 'Bacon ipsum dolor amet sunt anim chuck in ham hock pastrami. Shank fugiat hamburger meatball. Corned beef nostrud kevin non pork chop capicola beef ribs pastrami.',
                    versionName: 'Latest s1',
                    slicesUrl: "sheet/slices.zip",
                    previewUrl: "sheet/preview.png",
                    projectId: "project_1",
                    id: "sheet001-r0",
                    rotation: 0,
	                favorite: true,
                    annotationVersion: "usdfhasdf",
	                CreatedDate: '20150105 220506',
                    annotations: [
                        {
                            id: "4cf1e6-1966284-edb88cb9a5-058715f13",
                            userId: "arandomuserid",
                            type: 9,
                            version: "1238fdsya",
                            data: '{"id":"4cf1e6-1966284-edb88cb9a5-058715f13","areaVisible":0,"colorRed":1,"userId":"c1af2a3f52cc48c082b289907882f2e6","type":9,"colorBlue":0,"zOrder":0,"unitOfMeasure":"na","projectId":"project_1","links":[{"id":"genID","createdDate":"2015-02-19T16:54:04.00","name":"Google","uri":"http://google.com","hidden":false,"action":0}],"points":[{"x":769.8622,"y":1948.223},{"x":796.7962,"y":1880.888},{"x":796.7962,"y":1880.888},{"x":794.5517,"y":1829.265},{"x":774.3512,"y":1766.419},{"x":756.3953,"y":1701.328},{"x":745.1728,"y":1640.727},{"x":738.4393,"y":1580.125},{"x":736.1948,"y":1530.747},{"x":738.4393,"y":1483.612},{"x":754.1508,"y":1447.7},{"x":776.5957,"y":1418.522},{"x":816.9966,"y":1402.81},{"x":870.8646,"y":1391.588},{"x":917.999,"y":1389.343},{"x":971.8669,"y":1396.077},{"x":1014.512,"y":1427.5},{"x":1054.913,"y":1463.412},{"x":1093.07,"y":1503.812},{"x":1128.982,"y":1544.214},{"x":1162.649,"y":1577.881},{"x":1191.828,"y":1598.081},{"x":1218.761,"y":1607.059},{"x":1238.962,"y":1609.304},{"x":1254.673,"y":1609.304},{"x":1270.385,"y":1598.081},{"x":1283.852,"y":1568.903},{"x":1292.83,"y":1535.235},{"x":1301.808,"y":1490.346},{"x":1310.786,"y":1445.456},{"x":1310.786,"y":1409.544},{"x":1310.786,"y":1366.898},{"x":1308.541,"y":1339.964},{"x":1299.563,"y":1304.052},{"x":1297.319,"y":1274.874},{"x":1295.074,"y":1247.94},{"x":1304.052,"y":1218.761},{"x":1328.742,"y":1196.317},{"x":1360.165,"y":1180.605},{"x":1396.077,"y":1180.605},{"x":1438.722,"y":1180.605},{"x":1490.346,"y":1198.561},{"x":1532.991,"y":1207.539},{"x":1577.881,"y":1212.028},{"x":1609.304,"y":1212.028},{"x":1627.26,"y":1198.561},{"x":1636.238,"y":1162.649},{"x":1645.216,"y":1122.248},{"x":1654.194,"y":1086.336},{"x":1669.905,"y":1050.424},{"x":1701.328,"y":1025.735},{"x":1739.485,"y":1019.001},{"x":1791.108,"y":1023.49},{"x":1842.731,"y":1050.424},{"x":1887.622,"y":1079.603},{"x":1932.511,"y":1102.048},{"x":1961.69,"y":1111.026},{"x":1986.379,"y":1111.026},{"x":2008.824,"y":1081.847},{"x":2026.78,"y":1045.935},{"x":2040.247,"y":1001.045},{"x":2062.692,"y":958.3999},{"x":2082.893,"y":931.4659},{"x":2105.338,"y":915.7545},{"x":2134.516,"y":913.51},{"x":2172.673,"y":924.7325},{"x":2213.073,"y":960.6444},{"x":2246.741,"y":1007.779},{"x":2273.675,"y":1066.136},{"x":2291.631,"y":1133.471},{"x":2302.853,"y":1203.05},{"x":2305.098,"y":1263.651},{"x":2302.853,"y":1306.297},{"x":2280.408,"y":1351.187},{"x":2240.007,"y":1375.876},{"x":2179.406,"y":1389.343},{"x":2105.338,"y":1391.588},{"x":2029.025,"y":1382.61},{"x":1954.956,"y":1366.898},{"x":1894.355,"y":1362.409},{"x":1853.954,"y":1362.409},{"x":1813.553,"y":1396.077},{"x":1788.864,"y":1458.923},{"x":1770.908,"y":1546.458},{"x":1761.93,"y":1647.46},{"x":1752.952,"y":1734.996},{"x":1739.485,"y":1802.331},{"x":1721.529,"y":1835.998},{"x":1685.617,"y":1851.709},{"x":1631.749,"y":1844.976},{"x":1573.392,"y":1818.042},{"x":1519.524,"y":1788.864},{"x":1481.368,"y":1773.152},{"x":1454.434,"y":1770.908},{"x":1438.722,"y":1786.619},{"x":1438.722,"y":1851.709},{"x":1440.967,"y":1928.022},{"x":1447.7,"y":2015.558},{"x":1447.7,"y":2082.893},{"x":1445.456,"y":2121.049},{"x":1429.744,"y":2136.76},{"x":1396.077,"y":2127.782},{"x":1348.942,"y":2091.871},{"x":1299.563,"y":2046.981},{"x":1259.162,"y":2006.58},{"x":1232.229,"y":1986.379},{"x":1214.272,"y":1984.135},{"x":1205.295,"y":1986.379},{"x":1205.295,"y":2033.514},{"x":1209.784,"y":2094.115},{"x":1212.028,"y":2143.494},{"x":1214.272,"y":2190.628},{"x":1212.028,"y":2201.851},{"x":1191.828,"y":2204.095},{"x":1149.182,"y":2159.206},{"x":1111.026,"y":2103.093},{"x":1072.869,"y":2049.225},{"x":1045.935,"y":2002.091},{"x":1027.979,"y":1970.668},{"x":1023.49,"y":1954.956},{"x":1021.246,"y":1950.467},{"x":1027.979,"y":1954.956},{"x":1050.424,"y":1981.89},{"x":1070.625,"y":2004.335},{"x":1086.336,"y":2015.558},{"x":1095.314,"y":2017.802},{"x":1097.559,"y":2004.335},{"x":1095.314,"y":1957.201},{"x":1075.114,"y":1892.11},{"x":1052.669,"y":1827.02},{"x":1030.224,"y":1766.419},{"x":1010.023,"y":1721.529},{"x":998.8008,"y":1690.106},{"x":989.8229,"y":1667.661},{"x":985.3339,"y":1651.949},{"x":983.0894,"y":1636.238},{"x":983.0894,"y":1620.526},{"x":983.0894,"y":1591.348},{"x":980.8449,"y":1546.458},{"x":971.8669,"y":1488.101},{"x":960.6444,"y":1434.233},{"x":951.6664,"y":1393.832},{"x":947.1774,"y":1362.409},{"x":944.933,"y":1335.475},{"x":942.6885,"y":1315.275},{"x":942.6885,"y":1290.585},{"x":942.6885,"y":1263.651},{"x":940.444,"y":1225.495},{"x":933.7104,"y":1187.339},{"x":926.977,"y":1142.449},{"x":917.999,"y":1099.803},{"x":906.7765,"y":1063.891},{"x":902.2875,"y":1034.713},{"x":895.554,"y":998.8008},{"x":891.0651,"y":967.3779},{"x":884.3315,"y":935.955},{"x":877.598,"y":906.7765},{"x":875.3536,"y":891.0651},{"x":875.3536,"y":879.8425},{"x":875.3536,"y":868.6201},{"x":886.576,"y":861.8866},{"x":909.021,"y":855.1531},{"x":931.4659,"y":848.4196},{"x":958.3999,"y":839.4417},{"x":985.3339,"y":834.9526},{"x":1010.023,"y":832.7081},{"x":1030.224,"y":832.7081},{"x":1045.935,"y":832.7081}],"fill":0,"colorGreen":0.6470588,"sheetId":"9c6ff110fa61454694532d69045727ee","lineWidth":53.86792}'
                        },
                        {
                            id: "048-40b5829aa4-088801edaf9869-70a72",
                            userId: "",
                            type: 6,
                            version: "23vasdfg",
                            data: '{"id":"048-40b5829aa4-088801edaf9869-70a72","projectId":"project_1","sheetId":"guid","type":6,"colorRed":1,"colorGreen":0,"colorBlue":0,"zOrder":0,"fill":0,"areaVisible":0,"lineWidth":7.5,"unitOfMeasure":"na","x":3037.162891046386,"y":2915.9719525350592,"width":786.7879003898297,"height":551.7229772489736,"text":"brad","textSize":128,"links":[{"id":"genID2","createdDate":"2015-02-19T16:54:04.00","name":"Another sheet link","uri":"bluvueplans://projects/project_1/sheets/sheet001-r0","hidden":false,"action":0}]}'
                        },
                        {
                          id: 'c36--387e9ad2e47098--aaf72d4cb8--e79f0',
                          userId: 'guid',
                          type: 10,
                          version: "fqegehs",
                          data: '{"id":"c36--387e9ad2e47098--aaf72d4cb8--e79f0","projectId":"project_1","sheetId":"guid","userId":"guid","type":10,"colorRed":0.898,"colorGreen":0,"colorBlue":0.273,"zOrder":0,"fill":0,"areaVisible":0,"lineWidth":7.5,"unitOfMeasure":"ft","points":[{"x":2348.0025234602954,"y":5998.389953473701},{"x":3767.4252819178296,"y":5974.164734642378}],"distance":300}'
                        },
                        {
                          id: 'c36--387e9ad2e47098--aaf72d4cb8--e79f1',
                          userId: null,
                          type: 10,
                          version: "fqegehs",
                          data: '{"id":"c36--387e9ad2e47098--aaf72d4cb8--e79f1","projectId":"project_1","sheetId":"guid","userId":null,"type":10,"colorRed":0.898,"colorGreen":0,"colorBlue":0.273,"zOrder":0,"fill":0,"areaVisible":0,"lineWidth":7.5,"unitOfMeasure":"ft","points":[{"x":1238.0025234602954,"y":5238.389953473701},{"x":3767.4252819178296,"y":5274.164734642378}],"distance":100}'
                        },
                        {
                            id: "3e457065b71f4f90857f8161314afc8b",
                            userId: "guid",
                            type: 1,
                            version: "qewrgqer",
                            data: '{"id":"3e457065b71f4f90857f8161314afc8b","projectId":"project_1","sheetId":"guid","userId":"guid","type":1,"colorRed":0.058823529411764705,"colorGreen":0.38823529411764707,"colorBlue":0.8941176470588236,"zOrder":0,"fill":1,"perimeterVisible":1,"areaVisible":0,"lineWidth":7.5,"unitOfMeasure":"ft","x":1868.6369344133827,"y":3982.678780228193,"width":2510.449196870806,"height":519.954943142649,"attachments":[{"createdDate":"2015-02-17T16:54:04.00","id":"f7e2b8e5d0dd45b6923aa42fe2237418","name":"Photo_1.png","mimeType":"image/png","url":"http://oi60.tinypic.com/33mah6s.jpg","userId":"a7e2b8e5d0dd45b6923aa42fe2237418","email":"bseay@bluvue.com","location":{"id":"f7e2b8e5d0dd45b6923aa42fe2237418","horizontalAccuracy":192,"longitude":-96.8175661149196,"verticalAccuracy":192,"latitude":33.06953235078641,"altitude":124.7712583396452,"determinationDate":"2014-12-05 16:37:27"}}]}'
                        },
                        {
                            id: 'e39ddf5ca3184ea2a8b1adeaa5e4b97e',
                            userId: "guid",
                            type: 13,
                            version: "qewfqwef",
                            data: '{"id":"e39ddf5ca3184ea2a8b1adeaa5e4b97e","projectId":"project_1","sheetId":"sheet001r0","userId":"guid","type":13,"colorRed":0.898,"colorGreen":0,"colorBlue":0.273,"zOrder":0,"fill":0,"perimeterVisible":0,"areaVisible":1,"lineWidth":7.5,"unitOfMeasure":"ft2","points":[{"x":5894.363581910751,"y":2979.8074273734655},{"x":5396.010781671158,"y":3715.8361784965555},{"x":6921.737047020065,"y":3938.17819706499},{"x":6983.072776280323,"y":3370.8227014076074}],"closed":true,"attachments":[{"createdDate":"2015-02-19T16:53:05.00","id":"f7e2b8e5d0dd45b6923aa42fe2237419","name":"Photo_2.png","mimeType":"image/png","url":"http://oi60.tinypic.com/33mah6s.jpg","userId":"a7e2b8e5d0dd45b6923aa42fe2237418","email":"bseay@bluvue.com","location":{"id":"f7e2b8e5d0dd45b6923aa42fe2237418","horizontalAccuracy":192,"longitude":-96.8175661149196,"verticalAccuracy":192,"latitude":33.06953235078641,"altitude":124.7712583396452,"determinationDate":"2014-12-05 16:37:27"}},{"createdDate":"2015-02-19T16:54:04.00","id":"f7e2b8e5d0dd45b6923aa42fe2237418","name":"GarageVideo-front.mp4","mimeType":"video/mp4","url":"http://techslides.com/demos/sample-videos/small.mp4","userId":"a7e2b8e5d0dd45b6923aa42fe2237418","email":"bseay@bluvue.com","location":{"id":"f7e2b8e5d0dd45b6923aa42fe2237418","horizontalAccuracy":192,"longitude":-96.8175661149196,"verticalAccuracy":192,"latitude":33.06953235078641,"altitude":124.7712583396452,"determinationDate":"2014-12-05 16:37:27"}},{"createdDate":"2015-02-19T16:55:04.00","id":"f7e2b8e5d0dd45b6923aa42fe2237418","name":"office.mp4","mimeType":"video/mp4","url":"https://s3.amazonaws.com/attachments.test.bluvueplans.com/a6Dbtw9PSxWBIui030CYKA?AWSAccessKeyId=AKIAJEZOLQHPQQ5ODHCA&Expires=1430834074&Signature=Fdqx8YdEbzBtOGuH5OXXhFi6DtM%3D","userId":"a7e2b8e5d0dd45b6923aa42fe2237418","email":"bseay@bluvue.com","location":{"id":"f7e2b8e5d0dd45b6923aa42fe2237418","horizontalAccuracy":192,"longitude":-96.8175661149196,"verticalAccuracy":192,"latitude":33.06953235078641,"altitude":124.7712583396452,"determinationDate":"2014-12-05 16:37:27"}},{"createdDate":"2015-02-19T16:54:04.00","id":"f7e2b8e5d0dd45b6923aa42fe2237418","name":"Note-9-13-14.mp3","mimeType":"audio/mpeg","url":"http://www.noiseaddicts.com/samples/55.mp3","userId":"a7e2b8e5d0dd45b6923aa42fe2237418","email":"bseay@bluvue.com","location":{"id":"f7e2b8e5d0dd45b6923aa42fe2237418","horizontalAccuracy":192,"longitude":-96.8175661149196,"verticalAccuracy":192,"latitude":33.06953235078641,"altitude":124.7712583396452,"determinationDate":"2014-12-05 16:37:27"}},{"createdDate":"2015-02-19T16:54:04.00","id":"f7e2b8e5d0dd45b6923aa42fe2237418","name":"Inspector-Notes.pdf","mimeType":"application/pdf","url":"http://www.acs.psu.edu/drussell/Demos/SWR/SmithChart.pdf","userId":"a7e2b8e5d0dd45b6923aa42fe2237418","email":"bseay@bluvue.com","location":{"id":"f7e2b8e5d0dd45b6923aa42fe2237418","horizontalAccuracy":192,"longitude":-96.8175661149196,"verticalAccuracy":192,"latitude":33.06953235078641,"altitude":124.7712583396452,"determinationDate":"2014-12-05 16:37:27"}}]}'
                        },
                        {
                            id: 'c0986619c0ab4b7a90522b36c1e052a1',
                            userId: 'guid',
                            type: 3,
                            version: 'kjygqweqw',
                            data: '{"id":"c0986619c0ab4b7a90522b36c1e052a1","projectId":"project_1","sheetId":"sheet001r0","userId":"guid","type":3,"colorRed":0.7803921568627451,"colorGreen":0,"colorBlue":0.8745098039215686,"zOrder":0,"fill":1,"perimeterVisible":1,"areaVisible":0,"lineWidth":7.5,"unitOfMeasure":"ft","attachments":[],"x":5088.526997840173,"y":1581.518358531317,"width":731.7473002159832,"height":684.5377969762421,"attachments":[{"createdDate":"2015-02-19T15:54:04.00","id":"f7e2b8e5d0dd45b6923aa42fe2237418","name":"Photo_3.png","mimeType":"image/png","url":"http://oi60.tinypic.com/33mah6s.jpg","userId":"a7e2b8e5d0dd45b6923aa42fe223741a","email":"very.long.email.address@bluvue.com","location":{"id":"f7e2b8e5d0dd45b6923aa42fe2237418","horizontalAccuracy":192,"longitude":-96.8175661149196,"verticalAccuracy":192,"latitude":33.06953235078641,"altitude":124.7712583396452,"determinationDate":"2014-12-05 16:37:27"}}]}'
                        },
	                    {
		                    id: 'c0986619c0ab4b7a90522b31c1e052a1',
		                    userId: 'guid',
		                    type: 16,
		                    version: 'kjygqweqw',
		                    data: '{"id":"c0986619c0ab4b7a90522b36c1e052a1","projectId":"project_1","sheetId":"sheet001r0","userId":"guid","type":16,"colorRed":0.7803921568627451,"colorGreen":0,"colorBlue":0.8745098039215686,"zOrder":0,"fill":1,"perimeterVisible":1,"areaVisible":0,"lineWidth":7.5,"unitOfMeasure":"ft","attachments":[],"x":5088.526997840173,"y":5581.518358531317,"width":731.7473002159832,"height":684.5377969762421,"links":[{"id":"genID","createdDate":"2015-02-19T16:54:04.00","name":"Google","uri":"http://google.com","hidden":false,"action":0}]}'
	                    }
                    ]
                },
                {
                    name: 'Sheet 2!',
                    notes: null,
                    versionName: 'Latest s2',
                    slicesUrl: "sheet2/slices.zip",
                    previewUrl: "sheet2/preview.png",
                    projectId: "project_1",
                    id: "sheet002-r0",
	                favorite: true,
                    rotation: 0,
	                CreatedDate: '20150105 230506',
                    links: [
                        {
                            uri: "http://www.google.com",
                            id: "link3",
                            name: "Search",
                            CreatedDate: "2013-02-19T16:54:04.00"
                        },
                        {
                            uri: "http://www.apple.com",
                            id: "link4",
                            name: null,
                            CreatedDate: "2015-07-19T10:34:22.00"
                        }
                    ],
                    annotationVersion: "",
                    annotations: [
                        {
                            id: "4cf1e6-1966284-edb88cb9a5-058715f13",
                            userId: "arandomuserid",
                            type: 9,
                            version: "1238fdsya",
                            data: '{"id":"4cf1e6-1966284-edb88cb9a5-058715f13","areaVisible":0,"colorRed":1,"userId":"c1af2a3f52cc48c082b289907882f2e6","type":9,"colorBlue":0,"zOrder":0,"unitOfMeasure":"na","projectId":"project_1","points":[{"x":769.8622,"y":1948.223},{"x":796.7962,"y":1880.888},{"x":796.7962,"y":1880.888},{"x":794.5517,"y":1829.265},{"x":774.3512,"y":1766.419},{"x":756.3953,"y":1701.328},{"x":745.1728,"y":1640.727},{"x":738.4393,"y":1580.125},{"x":736.1948,"y":1530.747},{"x":738.4393,"y":1483.612},{"x":754.1508,"y":1447.7},{"x":776.5957,"y":1418.522},{"x":816.9966,"y":1402.81},{"x":870.8646,"y":1391.588},{"x":917.999,"y":1389.343},{"x":971.8669,"y":1396.077},{"x":1014.512,"y":1427.5},{"x":1054.913,"y":1463.412},{"x":1093.07,"y":1503.812},{"x":1128.982,"y":1544.214},{"x":1162.649,"y":1577.881},{"x":1191.828,"y":1598.081},{"x":1218.761,"y":1607.059},{"x":1238.962,"y":1609.304},{"x":1254.673,"y":1609.304},{"x":1270.385,"y":1598.081},{"x":1283.852,"y":1568.903},{"x":1292.83,"y":1535.235},{"x":1301.808,"y":1490.346},{"x":1310.786,"y":1445.456},{"x":1310.786,"y":1409.544},{"x":1310.786,"y":1366.898},{"x":1308.541,"y":1339.964},{"x":1299.563,"y":1304.052},{"x":1297.319,"y":1274.874},{"x":1295.074,"y":1247.94},{"x":1304.052,"y":1218.761},{"x":1328.742,"y":1196.317},{"x":1360.165,"y":1180.605},{"x":1396.077,"y":1180.605},{"x":1438.722,"y":1180.605},{"x":1490.346,"y":1198.561},{"x":1532.991,"y":1207.539},{"x":1577.881,"y":1212.028},{"x":1609.304,"y":1212.028},{"x":1627.26,"y":1198.561},{"x":1636.238,"y":1162.649},{"x":1645.216,"y":1122.248},{"x":1654.194,"y":1086.336},{"x":1669.905,"y":1050.424},{"x":1701.328,"y":1025.735},{"x":1739.485,"y":1019.001},{"x":1791.108,"y":1023.49},{"x":1842.731,"y":1050.424},{"x":1887.622,"y":1079.603},{"x":1932.511,"y":1102.048},{"x":1961.69,"y":1111.026},{"x":1986.379,"y":1111.026},{"x":2008.824,"y":1081.847},{"x":2026.78,"y":1045.935},{"x":2040.247,"y":1001.045},{"x":2062.692,"y":958.3999},{"x":2082.893,"y":931.4659},{"x":2105.338,"y":915.7545},{"x":2134.516,"y":913.51},{"x":2172.673,"y":924.7325},{"x":2213.073,"y":960.6444},{"x":2246.741,"y":1007.779},{"x":2273.675,"y":1066.136},{"x":2291.631,"y":1133.471},{"x":2302.853,"y":1203.05},{"x":2305.098,"y":1263.651},{"x":2302.853,"y":1306.297},{"x":2280.408,"y":1351.187},{"x":2240.007,"y":1375.876},{"x":2179.406,"y":1389.343},{"x":2105.338,"y":1391.588},{"x":2029.025,"y":1382.61},{"x":1954.956,"y":1366.898},{"x":1894.355,"y":1362.409},{"x":1853.954,"y":1362.409},{"x":1813.553,"y":1396.077},{"x":1788.864,"y":1458.923},{"x":1770.908,"y":1546.458},{"x":1761.93,"y":1647.46},{"x":1752.952,"y":1734.996},{"x":1739.485,"y":1802.331},{"x":1721.529,"y":1835.998},{"x":1685.617,"y":1851.709},{"x":1631.749,"y":1844.976},{"x":1573.392,"y":1818.042},{"x":1519.524,"y":1788.864},{"x":1481.368,"y":1773.152},{"x":1454.434,"y":1770.908},{"x":1438.722,"y":1786.619},{"x":1438.722,"y":1851.709},{"x":1440.967,"y":1928.022},{"x":1447.7,"y":2015.558},{"x":1447.7,"y":2082.893},{"x":1445.456,"y":2121.049},{"x":1429.744,"y":2136.76},{"x":1396.077,"y":2127.782},{"x":1348.942,"y":2091.871},{"x":1299.563,"y":2046.981},{"x":1259.162,"y":2006.58},{"x":1232.229,"y":1986.379},{"x":1214.272,"y":1984.135},{"x":1205.295,"y":1986.379},{"x":1205.295,"y":2033.514},{"x":1209.784,"y":2094.115},{"x":1212.028,"y":2143.494},{"x":1214.272,"y":2190.628},{"x":1212.028,"y":2201.851},{"x":1191.828,"y":2204.095},{"x":1149.182,"y":2159.206},{"x":1111.026,"y":2103.093},{"x":1072.869,"y":2049.225},{"x":1045.935,"y":2002.091},{"x":1027.979,"y":1970.668},{"x":1023.49,"y":1954.956},{"x":1021.246,"y":1950.467},{"x":1027.979,"y":1954.956},{"x":1050.424,"y":1981.89},{"x":1070.625,"y":2004.335},{"x":1086.336,"y":2015.558},{"x":1095.314,"y":2017.802},{"x":1097.559,"y":2004.335},{"x":1095.314,"y":1957.201},{"x":1075.114,"y":1892.11},{"x":1052.669,"y":1827.02},{"x":1030.224,"y":1766.419},{"x":1010.023,"y":1721.529},{"x":998.8008,"y":1690.106},{"x":989.8229,"y":1667.661},{"x":985.3339,"y":1651.949},{"x":983.0894,"y":1636.238},{"x":983.0894,"y":1620.526},{"x":983.0894,"y":1591.348},{"x":980.8449,"y":1546.458},{"x":971.8669,"y":1488.101},{"x":960.6444,"y":1434.233},{"x":951.6664,"y":1393.832},{"x":947.1774,"y":1362.409},{"x":944.933,"y":1335.475},{"x":942.6885,"y":1315.275},{"x":942.6885,"y":1290.585},{"x":942.6885,"y":1263.651},{"x":940.444,"y":1225.495},{"x":933.7104,"y":1187.339},{"x":926.977,"y":1142.449},{"x":917.999,"y":1099.803},{"x":906.7765,"y":1063.891},{"x":902.2875,"y":1034.713},{"x":895.554,"y":998.8008},{"x":891.0651,"y":967.3779},{"x":884.3315,"y":935.955},{"x":877.598,"y":906.7765},{"x":875.3536,"y":891.0651},{"x":875.3536,"y":879.8425},{"x":875.3536,"y":868.6201},{"x":886.576,"y":861.8866},{"x":909.021,"y":855.1531},{"x":931.4659,"y":848.4196},{"x":958.3999,"y":839.4417},{"x":985.3339,"y":834.9526},{"x":1010.023,"y":832.7081},{"x":1030.224,"y":832.7081},{"x":1045.935,"y":832.7081}],"fill":0,"colorGreen":0.6470588,"sheetId":"9c6ff110fa61454694532d69045727ee","lineWidth":53.86792}'
                        }
                    ]
                },
                {
                    name: 'Sheet 3!',
                    notes: null,
                    versionName: 'Latest s3',
                    slicesUrl: "sheet3/slices.zip",
                    previewUrl: "sheet3/preview.png",
                    projectId: "project_2",
                    id: "sheet003-r0",
                    rotation: 0,
                    links: [],
                    annotationVersion: "",
	                CreatedDate: '20150106 220506',
                    annotations: []
                }
            ];

            $scope.revisionsForCurrentSheet = function () {
              if( currentSheetIndex !== 0 )
                return[
                    {
                        name: sheets[currentSheetIndex].name,
                        notes: "Bacon ipsum dolor amet sunt anim chuck in ham hock pastrami.",
                        versionName: 'Latest',
                        id: sheets[currentSheetIndex].id
                    },
                ];
              else
                return [
                    {
                        name: sheets[0].name,
                        notes: "Bacon ipsum dolor amet sunt anim chuck in ham hock pastrami.",
                        versionName: 'Latest s1',
                        id: sheets[0].id
                    },
                    {
                        name: 'Revision 1',
                        notes: "Shank fugiat hamburger meatball. Corned beef nostrud kevin non pork chop capicola beef ribs pastrami.",
                        versionName: 'History r1',
                        id: "sheet001-r1"
                    },
                    {
                        name: 'Revision 2',
                        notes: "Corned beef nostrud kevin non pork chop capicola beef ribs pastrami.",
                        versionName: 'History r2',
                        id: "sheet001-r2"
                    }
                ];
            };

            $scope.openSheetById = function(sheetId) {
                $scope.sheet = {
                    name: 'Sheet 2!',
                    versionName: 'Latest s2a',
                    slicesUrl: "sheet2/slices.zip",
                    previewUrl: "sheet2/preview.png",
                    projectId: "guid",
                    id: sheetId,
                    rotation: 0,
                    annotationVersion: "",
                    annotations: []
                };
            };

            var currentSheetIndex = 0;

            $scope.sheet = sheets[currentSheetIndex];

            $scope.pinnedSheets = [];

            $scope.userId = "guid";

            $scope.email = $scope.userId + "@bluvuesheets.com";

            $scope.isAdmin = true;

	        $scope.canEditNotes = true;

	        $scope.fullName = 'Tester Name';

	        $scope.userHistory = [
		        { type: 'link',     uri: 'http://google.com' },
		        { type: 'favorite', uri: 'bluvueplans://projects/project_1/sheets/sheet001-r0' },
		        { type: 'favorite', uri: 'bluvueplans://projects/project_2/sheets/sheet003-r0' },
		        { type: 'link',     uri: 'bluvueplans://projects/project_2/sheets/sheet003-r0' }
	        ];

            $scope.closeSheet = function() {
                console.log("close sheet");
            };

            $scope.saveSheet = function(sheet) {
                var s = $scope.getSheetById(sheet.id);
                if (s === null) { return; }
                // this is only for testing ... i know it's just setting it's own name
                s.name = sheet.name;
                s.notes = sheet.notes;
            };

            $scope.getSheetById = function(sheetId) {
                for (var i = 0; i < sheets.length; i++) {
                    if (sheets[i].id === sheetId) {
                        return sheets[i];
                    }
                }

                return null;
            };

            $scope.nextSheet = function () {
                if (currentSheetIndex === sheets.length - 1) { return; }

                currentSheetIndex++;
                $scope.sheet = sheets[currentSheetIndex];
            };

            $scope.previousSheet = function () {
                if (currentSheetIndex === 0) { return; }

                currentSheetIndex--;
                $scope.sheet = sheets[currentSheetIndex];
            };

            $scope.getCurrentIndex = function () {
                return currentSheetIndex;
            };

            $scope.getTotalSheets = function () {
                return sheets.length;
            };

            var pendingUpdateAnnotations = [];
            var pendingDeleteAnnotationIds = [];
            $scope.syncAnnotations = function (version, modifiedAnnotations, deletedAnnotationIds) {
                /*
                 * returns a $q promise
                 *
                 * usage:
                 * syncAnnotations(vars).then(function(results) {
                 *  // runs on success
                 *  { data: {
                 *      version: "string",
                 *      annotations: [annotation object array],
                 *      annotationDeletes: [array of annotation id strings]
                 *      }
                 *  }
                 * })
                 * .catch(function(error) {
                 *  // runs on error
                 * })
                 * .finally(function() {
                 *  // runs at the end no matter what
                 * });
                 *
                 */

                var throwSaveError = false;
                var deferred = $q.defer();
                var testVersionId = "3skjcwwud"; // returned version

                if( modifiedAnnotations && modifiedAnnotations.length )
                {
                  modifiedAnnotations.forEach( function( annotation ){
                    pendingUpdateAnnotations.push( annotation );
                  });
                }

                if( deletedAnnotationIds && deletedAnnotationIds.length )
                {
                  deletedAnnotationIds.forEach( function(id) {
                    pendingDeleteAnnotationIds.push( id );
                  });
                }

                setTimeout(function () {
                    if (throwSaveError) {
                        deferred.reject('Reason the annotations could not be synced.');
                    } else {
                        var modifiedAnnotations = pendingUpdateAnnotations;
                        var deletedAnnotationIds = pendingDeleteAnnotationIds;
                        pendingUpdateAnnotations = [];
                        pendingDeleteAnnotationIds = [];
                        deferred.resolve({
                            data: {
                                version: testVersionId,
                                annotations: modifiedAnnotations,
                                annotationDeletes: deletedAnnotationIds
                            }
                        });
                    }
                }, 1000);
                return deferred.promise;
            };

            $scope.filepickerApiKey = 'AoqLChA0tQG2uRy1QiwjEz';
            $scope.attachmentsBucketName = 'attachments.test.bluvueplans.com';

            $scope.projects = projects;
        }
    ]);



