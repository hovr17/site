document.addEventListener('DOMContentLoaded', function() {
  const videoPoster = document.getElementById('videoPoster');
  
  if (videoPoster && videoPoster.dataset.bgImage) {
    videoPoster.style.backgroundImage = `url('${videoPoster.dataset.bgImage}')`;
  }
});