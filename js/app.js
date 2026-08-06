const platforms = [

    {
        name: "دیجی‌کالا",
        description: "بزرگ‌ترین فروشگاه اینترنتی ایران",
        image: "assets/digikala.png",
        link: "#"
    },


    {
        name: "ترب",
        description: "مقایسه قیمت هزاران فروشگاه",
        image: "assets/torob.png",
        link: "#"
    },


    {
        name: "باسلام",
        description: "بازار محصولات ایرانی",
        image: "assets/basalam.png",
        link: "#"
    }

];



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


            <a 
            href="${platform.link}"
            class="platform-btn">

            ورود به فروشگاه

            </a>


        </div>

    `;


    container.appendChild(card);


});
