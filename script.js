//first lets get the input data
//2. we don't want the input to be empty
console.log("Script.js loaded");

const cityInput = document.querySelector(".city-input");
const searchBtn = document.querySelector(".search-btn");

const weatherInfoSection = document.querySelector('.weather-info')
const notFoundSection = document.querySelector('.not-found')
const searchCitySection = document.querySelector('.search-city')

const apiKey = "413136e7e9b834c00ad82acfdb08f070";

const countryTxt = document.querySelector('.country-txt')
const tempTxt = document.querySelector('.temp-txt')
const conditionTxt = document.querySelector('.condition-txt')
const humidityValueTxt = document.querySelector('.humidity-value-txt')
const windValueTxt = document.querySelector('.wind-value-txt')
const weatherSummaryImg = document.querySelector('.weather-summary-img')
const currentDateTxt = document.querySelector('.current-date-txt')

//a new variable to access forecast items
const forecastItemsContainer = document.querySelector('.forecast-items-container')

searchBtn.addEventListener("click", () => {
  if (cityInput.value.trim() != "") {
    updateWeatherInfo(cityInput.value);
    cityInput.value = "";
    cityInput.blur();
  }
});

// Takes the input with the enter key as well
cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && cityInput.value.trim() != "") {
    updateWeatherInfo(cityInput.value);
    cityInput.value = "";
    cityInput.blur();
  }
});

//function that calls the api with the endpoint and the city name and returns the response.
async function getFetchData(endPoint,city) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${apiKey}&units=metric`;
  //to convert the temprature into °C use units=metric

  const response = await fetch(apiUrl)

  return response.json()
}

function getWeatherIcon(id) {
    if(id <= 232) return 'thunderstorm.svg'
    if(id <= 321) return 'drizzle.svg'
    if(id <= 531) return 'rain.svg'
    if(id <= 622) return 'snow.svg'
    if(id <= 781) return 'atmosphere.svg'
    if(id <= 800) return 'clear.svg'
    else return 'clouds.svg'
}

//to get the current date
function getCurrentDate(){
    const currentDate = new Date()
    //saving the different parts of the date
    const options = {
        weekday : 'short',
        day: '2-digit',
        month: 'short'
    }

    return currentDate.toLocaleDateString('en-GB',options)
    // console.log(currentDate)
}

async function updateWeatherInfo(city) {
//weatherData is kind of a new datatype that could store the data of format of a city's atmosphere data.
  const weatherData = await getFetchData('weather',city);

  if(weatherData.cod != 200){
    showDisplaySection(notFoundSection)
    return
  }

//   console.log(weatherData)

  //let's take each important value and store it into a variable
  const {
    name: country,
    main: {temp,humidity},
    weather: [{id, main}],
    wind: {speed}
  } = weatherData

  countryTxt.textContent = country
  tempTxt.textContent = Math.round(temp) + '°C'
  humidityValueTxt.textContent = humidity + '%'
  windValueTxt.textContent = speed + ' m/s'
  conditionTxt.textContent = main

  currentDateTxt.textContent = getCurrentDate()

  weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id)}`
  
  //to get the upcomming forecast
  await updateForecastInfo(city)

  speakWeather(country, Math.round(temp), main);//VOICE OUTPUT


  showDisplaySection(weatherInfoSection)
  
}
async function updateForecastInfo(city){
    const forecastData = await getFetchData('forecast',city);
    
    const timeTaken = '12:00:00'
    //seperate date with letter T and take the first index of the array to get the date
    const todayDate = new Date().toISOString().split('T')[0] 

    forecastItemsContainer.innerHTML = ''

    //let's take only the time at 12:00:00 and not include today's 12AM
    forecastData.list.forEach(forecastWeather => {
        if(forecastWeather.dt_txt.includes(timeTaken) && 
            !forecastWeather.dt_txt.includes(todayDate)){
            // console.log(forecastWeather)
            updateForecastItems(forecastWeather)
        }
})

    // console.log(todayDate) 
}

//function to update the forecast cards
function updateForecastItems(weatherData){
    const {
        dt_txt : date,
        weather : [{ id }], //we just 
        main : { temp }
    } = weatherData

    const dateTaken = new Date(date)
    const dateOption = {
        day : '2-digit',
        month : 'short'
    }

    const dateResult = dateTaken.toLocaleDateString('en-US',dateOption)

    const forecastItem = `
        <div class="forecast-item">
            <h5 class="forecast-item-date regular-txt">${dateResult}</h5>
                <img src="assets/weather/${getWeatherIcon(id)}" alt="" class="forecast-item-img">
            <h5 class="forecast-item-temp">
            ${Math.round(temp)+ "°C"}</h5>
        </div>
    `
    forecastItemsContainer.insertAdjacentHTML('beforeend',forecastItem)

}


function showDisplaySection(section){
    [weatherInfoSection, searchCitySection, notFoundSection]
        .forEach(section => section.style.display = 'none')
    
    section.style.display = 'flex'
}

//-------------------------------for map----------------------
let leafletMap;

function openLeafletMap() {
  document.getElementById("leafletMapContainer").style.display = "flex";

  if (!leafletMap) {
    leafletMap = L.map("leafletMap").setView([20.5937, 78.9629], 4); // India by default

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(leafletMap);

    leafletMap.on("click", function (e) {
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;
      getWeatherByCoords(lat, lon);
      closeLeafletMap();
    });
  }
}

function closeLeafletMap() {
  document.getElementById("leafletMapContainer").style.display = "none";
}

async function getWeatherByCoords(lat, lon) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  const response = await fetch(apiUrl);
  const weatherData = await response.json();

  if (weatherData.cod != 200) {
    showDisplaySection(notFoundSection);
    return;
  }

  const {
    name: country,
    main: { temp, humidity },
    weather: [{ id, main }],
    wind: { speed },
  } = weatherData;

  countryTxt.textContent = country;
  tempTxt.textContent = Math.round(temp) + "°C";
  humidityValueTxt.textContent = humidity + "%";
  windValueTxt.textContent = speed + " m/s";
  conditionTxt.textContent = main;
  currentDateTxt.textContent = getCurrentDate();
  weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id)}`;

  showDisplaySection(weatherInfoSection);
}
/// 🎙️ Let's integrate voice input so that users can speak the name of a city and your app fetches the weather for it — a perfect addition to your elegant UX.

//We’ll use the Web Speech API's SpeechRecognition interface — it's free and supported in most modern browsers(especially Chrome---------------------VOICESEARCH-----------
// 🎤 Voice Input
const micBtn = document.querySelector(".mic-btn");

// Check if browser supports SpeechRecognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";

  micBtn.addEventListener("click", () => {
    recognition.start();
  });

  recognition.onresult = (event) => {
    const spokenText = event.results[0][0].transcript;
    cityInput.value = spokenText;
    updateWeatherInfo(spokenText);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };
} else {
  micBtn.style.display = "none"; // Hide button if not supported
  console.warn("SpeechRecognition not supported in this browser.");
}


// voice output (text-to-speech) using the browser's SpeechSynthesis API, so after searching a city, your app can speak:

// 🔊 SPEAK THE WEATHER
function speakWeather(city, temp, condition) {
  const sentence = `The weather in ${city} is ${temp} degrees Celsius with ${condition}`;
  const utterance = new SpeechSynthesisUtterance(sentence);
  utterance.lang = "en-US";
  utterance.rate = .75;
  utterance.pitch = 1.4;
  speechSynthesis.speak(utterance);
}
