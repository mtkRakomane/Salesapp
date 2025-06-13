   window.addEventListener("load", () => {
      setTimeout(() => {
        document.getElementById("loader").classList.add("hidden");
        document.getElementById("main-content").classList.remove("hidden");
      }, 2500); 
    });