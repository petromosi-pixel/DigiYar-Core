const container = document.getElementById("platforms");
const searchBox = document.getElementById("searchBox");


function renderPlatforms(list) {

    container.innerHTML = "";


    if (list.length === 0) {

        container.innerHTML = `
            <div class="no-results">
                فروشگاهی با این نام پیدا نشد.
            </div>
        `;

        return;
    }


    list.forEach(platform => {

        const card = document.createElement("div");

        card.className = "platform-card";


        card.innerHTML = `

            ${
                platform.active
                ?
                `
                <a
                    href="${platform.link}"
                    class="platform-btn"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <span class="btn-text">
                        ورود به فروشگاه
                    </span>
                </a>
                `
                :
                `
                <span class="coming-soon">
                    به‌زودی
                </span>
                `
            }


            <div class="platform-info">

                <h3>
                    ${platform.name}
                </h3>

                <p>
                    ${platform.description}
                </p>

            </div>


            <img
                src="${platform.image}"
                alt="${platform.name}"
            >

        `;


        container.appendChild(card);

    });

}


/* =========================================
   نمایش اولیه
========================================= */

renderPlatforms(platforms);


/* =========================================
   جستجوی فروشگاه
========================================= */

searchBox.addEventListener("input", function () {

    const searchText = searchBox.value
        .trim()
        .toLowerCase();


    const filteredPlatforms =
        platforms.filter(platform => {

            return (
                platform.name
                    .toLowerCase()
                    .includes(searchText)
                ||
                platform.description
                    .toLowerCase()
                    .includes(searchText)
            );

        });


    renderPlatforms(filteredPlatforms);

});
