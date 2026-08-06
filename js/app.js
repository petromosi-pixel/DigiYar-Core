const container = document.getElementById("platforms");


platforms.forEach(platform => {


    const card = document.createElement("div");

    card.className = "platform-card";


    card.innerHTML = `

        <img 
        src="${platform.image}" 
        alt="${platform.name}">


        <div class="platform-info">


            <h3>
            ${platform.name}
            </h3>


            <p>
            ${platform.description}
            </p>


            ${
            platform.active
            ?
            `
            <a 
            href="${platform.link}"
            class="platform-btn">

            ورود به فروشگاه

            </a>
            `
            :
            `
            <span class="coming-soon">
            به‌زودی
            </span>
            `
            }


        </div>

    `;


    container.appendChild(card);


});
