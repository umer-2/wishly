(function () {
  const STORAGE_KEY = "wishly_wishlist";

  /**
   * Get guest wishlist from localStorage
   */
  function getWishlist() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);

      if (!data) {
        return [];
      }

      const wishlist = JSON.parse(data);

      if (!Array.isArray(wishlist)) {
        return [];
      }

      // Make sure every item has a consistent structure
      return wishlist
        .map((item) => {
          if (typeof item === "string" || typeof item === "number") {
            return {
              productId: String(item),
              handle: "",
              addedAt: null
            };
          }

          if (item && typeof item === "object") {
            return {
              productId: String(item.productId || item.id || ""),
              handle: item.handle || "",
              addedAt: item.addedAt || null
            };
          }

          return null;
        })
        .filter((item) => item && item.productId);
    } catch (error) {
      console.error(
        "Wishly: Failed to read wishlist",
        error
      );

      return [];
    }
  }

  /**
   * Save guest wishlist
   */
  function saveWishlist(wishlist) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(wishlist)
    );

    updateButtons();
    updateCounter();
  }

  /**
   * Add product to guest wishlist
   */
  function addToWishlist(productId, handle) {
    const wishlist = getWishlist();

    const exists = wishlist.some(
      (item) =>
        String(item.productId) === String(productId)
    );

    if (exists) {
      return;
    }

    wishlist.push({
      productId: String(productId),
      handle: handle || "",
      addedAt: new Date().toISOString()
    });

    saveWishlist(wishlist);

    console.log(
      "Wishly: Product added",
      productId
    );
  }

  /**
   * Remove product from guest wishlist
   */
  function removeFromWishlist(productId) {
    const wishlist = getWishlist();

    const updatedWishlist = wishlist.filter(
      (item) =>
        String(item.productId) !== String(productId)
    );

    saveWishlist(updatedWishlist);

    console.log(
      "Wishly: Product removed",
      productId
    );
  }

  /**
   * Toggle wishlist
   */
  function toggleWishlist(productId, handle) {
    const wishlist = getWishlist();

    const exists = wishlist.some(
      (item) =>
        String(item.productId) === String(productId)
    );

    if (exists) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId, handle);
    }
  }

  /**
   * Update wishlist heart buttons
   */
  function updateButtons() {
    const wishlist = getWishlist();

    document
      .querySelectorAll("[data-wishora-product]")
      .forEach((button) => {
        const productId =
          button.dataset.wishoraProduct;

        const exists = wishlist.some(
          (item) =>
            String(item.productId) ===
            String(productId)
        );

        const heart =
          button.querySelector(".wishora-heart");

        if (exists) {
          button.classList.add(
            "wishora-active"
          );

          if (heart) {
            heart.textContent = "♥";
          } else {
            button.textContent = "♥";
          }

          button.setAttribute(
            "aria-label",
            "Remove from wishlist"
          );
        } else {
          button.classList.remove(
            "wishora-active"
          );

          if (heart) {
            heart.textContent = "♡";
          } else {
            button.textContent = "♡";
          }

          button.setAttribute(
            "aria-label",
            "Add to wishlist"
          );
        }
      });
  }

  /**
   * Update wishlist counter
   */
  function updateCounter() {
    const wishlist = getWishlist();

    document
      .querySelectorAll(
        "[data-wishora-counter]"
      )
      .forEach((counter) => {
        counter.textContent =
          wishlist.length;
      });
  }

  /**
   * Handle wishlist button clicks
   */
  document.addEventListener(
    "click",
    function (event) {
      const button =
        event.target.closest(
          "[data-wishora-product]"
        );

      if (!button) {
        return;
      }

      event.preventDefault();

      const productId =
        button.dataset.wishoraProduct;

      const handle =
        button.dataset.wishoraHandle;

      if (!productId) {
        console.error(
          "Wishly: Product ID missing"
        );

        return;
      }

      toggleWishlist(
        productId,
        handle
      );
    }
  );

  /**
   * Initialize
   */
  function init() {
    updateButtons();
    updateCounter();
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }

  /**
   * Public Wishly API
   */
  window.Wishly = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    updateButtons,
    updateCounter
  };
})();