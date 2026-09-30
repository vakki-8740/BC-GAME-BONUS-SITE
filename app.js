document.addEventListener('DOMContentLoaded', function () {

    const cards = document.querySelectorAll('.card');

    cards.forEach(function (card, i) {
        card.style.animation = 'riseIn .5s ease both';
        card.style.animationDelay = (i * 0.09) + 's';
    });

});
