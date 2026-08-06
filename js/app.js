const platforms = [

    {
        name: "دیجی‌کالا",
        description: "بزرگ‌ترین فروشگاه اینترنتی ایران",
        image: "assets/digikala.png",
        link: "https://aflo.ir/16da7m1UY",
        active: true
    },


    {
        name: "اسنپ‌شاپ",
        description: "خرید آسان از فروشگاه آنلاین اسنپ",
        image: "assets/snappshop.png",
        link: "https://aflo.ir/YPN05dL7",
        active: true
    },


    {
        name: "ترب",
        description: "مقایسه قیمت هزاران فروشگاه",
        image: "assets/torob.png",
        link: "#",
        active: false
    },


    {
        name: "باسلام",
        description: "بازار محصولات ایرانی",
        image: "assets/basalam.png",
        link: "#",
        active: false
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
