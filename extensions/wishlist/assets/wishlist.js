(function () {
  const STORAGE_KEY = "wishly_wishlist";

  /*
   * ---------------------------------------------------------
   * CUSTOMER STATE
   * ---------------------------------------------------------
   */

  const customer = window.WishlyCustomer || {
    loggedIn: false,
    id: null
  };

  const isLoggedIn =
    customer.loggedIn === true && !!customer.id;

  console.log(
    "Wishly mode:",
    isLoggedIn ? "logged-in" : "guest"
  );

  console.log(
    "Wishly customer ID:",
    customer.id
  );


  /*
   * ---------------------------------------------------------
   * API
   * ---------------------------------------------------------
   */

  const API_URL =
    `${window.Shopify?.routes?.root || "/"}apps/wishly/api/wishlist`;


  /*
   * ---------------------------------------------------------
   * GUEST WISHLIST
   * ---------------------------------------------------------
   */

  function getGuestWishlist() {
    try {
      const data =
        localStorage.getItem(STORAGE_KEY);

      if (!data) {
        return [];
      }

      const wishlist =
        JSON.parse(data);

      if (!Array.isArray(wishlist)) {
        return [];
      }

      return wishlist
        .map((item) => {

          if (
            typeof item === "string" ||
            typeof item === "number"
          ) {
            return {
              productId: String(item),
              handle: "",
              addedAt: null
            };
          }

          if (
            item &&
            typeof item === "object"
          ) {
            return {
              productId: String(
                item.productId ||
                item.id ||
                ""
              ),
              handle:
                item.handle || "",
              addedAt:
                item.addedAt || null
            };
          }

          return null;
        })
        .filter(
          (item) =>
            item &&
            item.productId
        );

    } catch (error) {

      console.error(
        "Wishly: Failed to read guest wishlist",
        error
      );

      return [];
    }
  }


  /*
   * Save guest wishlist
   */

  function saveGuestWishlist(wishlist) {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(wishlist)
    );

    updateButtons();
    updateCounter();
  }


  /*
   * ---------------------------------------------------------
   * GET LOGGED-IN CUSTOMER WISHLIST
   * ---------------------------------------------------------
   */

  async function getCustomerWishlist() {

    if (!isLoggedIn) {
      return [];
    }

    console.log(
      "Wishly: Getting customer wishlist from API"
    );

    try {

      const response =
        await fetch(
          `${API_URL}?customerId=${encodeURIComponent(
            String(customer.id)
          )}`,
          {
            method: "GET",
            headers: {
              "Accept":
                "application/json"
            }
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to get wishlist"
        );
      }


      const items =
        data?.wishlist?.items;


      if (!Array.isArray(items)) {
        return [];
      }


      /*
       * Normalize API items
       */

      return items
        .map((item) => {

          if (
            typeof item === "string" ||
            typeof item === "number"
          ) {
            return {
              productId: String(item),
              handle: "",
              addedAt: null
            };
          }


          if (
            item &&
            typeof item === "object"
          ) {
            return {
              productId: String(
                item.productId ||
                item.id ||
                ""
              ),
              handle:
                item.handle || "",
              addedAt:
                item.addedAt || null
            };
          }


          return null;

        })
        .filter(
          (item) =>
            item &&
            item.productId
        );

    } catch (error) {

      console.error(
        "Wishly: Failed to get customer wishlist",
        error
      );

      return [];
    }
  }


  /*
   * ---------------------------------------------------------
   * SAVE LOGGED-IN CUSTOMER WISHLIST
   * ---------------------------------------------------------
   */

  async function saveCustomerWishlist(
    wishlist
  ) {

    if (!isLoggedIn) {

      console.warn(
        "Wishly: Cannot save customer wishlist while logged out"
      );

      return;
    }

    try {

      const response =
        await fetch(
          API_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              customerId:
                String(customer.id),

              shop:
                window.Shopify?.shop ||
                "hydrogende.myshopify.com",

              items:
                wishlist
            })
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to save wishlist"
        );
      }


      console.log(
        "Wishly: Customer wishlist saved",
        data
      );


      return data;

    } catch (error) {

      console.error(
        "Wishly: Failed to save customer wishlist",
        error
      );

      throw error;
    }
  }


  /*
   * ---------------------------------------------------------
   * GET WISHLIST
   * ---------------------------------------------------------
   *
   * Guest:
   *     localStorage
   *
   * Logged in:
   *     API
   */

  async function getWishlist() {

    if (isLoggedIn) {

      return await getCustomerWishlist();

    }

    return getGuestWishlist();
  }


  /*
   * ---------------------------------------------------------
   * ADD TO WISHLIST
   * ---------------------------------------------------------
   */

  async function addToWishlist(
    productId,
    handle
  ) {

    if (!productId) {
      return;
    }


    /*
     * -----------------------------------------------------
     * GUEST
     * -----------------------------------------------------
     */

    if (!isLoggedIn) {

      const wishlist =
        getGuestWishlist();


      const exists =
        wishlist.some(
          (item) =>
            String(
              item.productId
            ) ===
            String(productId)
        );


      if (exists) {
        return;
      }


      wishlist.push({
        productId:
          String(productId),

        handle:
          handle || "",

        addedAt:
          new Date().toISOString()
      });


      saveGuestWishlist(
        wishlist
      );


      console.log(
        "Wishly: Guest product added",
        productId
      );


      return;
    }


    /*
     * -----------------------------------------------------
     * LOGGED-IN CUSTOMER
     * -----------------------------------------------------
     */

    const wishlist =
      await getCustomerWishlist();


    const exists =
      wishlist.some(
        (item) =>
          String(
            item.productId
          ) ===
          String(productId)
      );


    if (exists) {
      return;
    }


    wishlist.push({
      productId:
        String(productId),

      handle:
        handle || "",

      addedAt:
        new Date().toISOString()
    });


    await saveCustomerWishlist(
      wishlist
    );


    console.log(
      "Wishly: Logged-in product added",
      productId
    );
  }


  /*
   * ---------------------------------------------------------
   * REMOVE FROM WISHLIST
   * ---------------------------------------------------------
   */

  async function removeFromWishlist(
    productId
  ) {

    if (!productId) {
      return;
    }


    /*
     * -----------------------------------------------------
     * GUEST
     * -----------------------------------------------------
     *
     * ONLY localStorage changes.
     *
     * Database remains untouched.
     */

    if (!isLoggedIn) {

      const wishlist =
        getGuestWishlist();


      const updatedWishlist =
        wishlist.filter(
          (item) =>
            String(
              item.productId
            ) !==
            String(productId)
        );


      saveGuestWishlist(
        updatedWishlist
      );


      console.log(
        "Wishly: Guest product removed from localStorage",
        productId
      );


      return;
    }


    /*
     * -----------------------------------------------------
     * LOGGED-IN CUSTOMER
     * -----------------------------------------------------
     *
     * Database gets updated.
     */

    const wishlist =
      await getCustomerWishlist();


    const updatedWishlist =
      wishlist.filter(
        (item) =>
          String(
            item.productId
          ) !==
          String(productId)
      );


    await saveCustomerWishlist(
      updatedWishlist
    );


    console.log(
      "Wishly: Logged-in product removed from database",
      productId
    );
  }


  /*
   * ---------------------------------------------------------
   * TOGGLE WISHLIST
   * ---------------------------------------------------------
   */

  async function toggleWishlist(
    productId,
    handle
  ) {

    const wishlist =
      await getWishlist();


    const exists =
      wishlist.some(
        (item) =>
          String(
            item.productId
          ) ===
          String(productId)
      );


    if (exists) {

      await removeFromWishlist(
        productId
      );

    } else {

      await addToWishlist(
        productId,
        handle
      );
    }
  }


  /*
   * ---------------------------------------------------------
   * UPDATE HEART BUTTONS
   * ---------------------------------------------------------
   */

  async function updateButtons() {

    const wishlist =
      await getWishlist();


    document
      .querySelectorAll(
        "[data-wishora-product]"
      )
      .forEach(
        (button) => {

          const productId =
            button.dataset
              .wishoraProduct;


          const exists =
            wishlist.some(
              (item) =>
                String(
                  item.productId
                ) ===
                String(productId)
            );


          const heart =
            button.querySelector(
              ".wishora-heart"
            );


          if (exists) {

            button.classList.add(
              "wishora-active"
            );


            if (heart) {

              heart.textContent =
                "♥";

            } else {

              button.textContent =
                "♥";
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

              heart.textContent =
                "♡";

            } else {

              button.textContent =
                "♡";
            }


            button.setAttribute(
              "aria-label",
              "Add to wishlist"
            );
          }
        }
      );
  }


  /*
   * ---------------------------------------------------------
   * UPDATE COUNTER
   * ---------------------------------------------------------
   */

  async function updateCounter() {

    const wishlist =
      await getWishlist();


    document
      .querySelectorAll(
        "[data-wishora-counter]"
      )
      .forEach(
        (counter) => {

          counter.textContent =
            wishlist.length;
        }
      );
  }


  /*
   * ---------------------------------------------------------
   * WISHLIST BUTTON CLICK
   * ---------------------------------------------------------
   */

  document.addEventListener(
    "click",
    async function (event) {

      const button =
        event.target.closest(
          "[data-wishora-product]"
        );


      if (!button) {
        return;
      }


      event.preventDefault();


      const productId =
        button.dataset
          .wishoraProduct;


      const handle =
        button.dataset
          .wishoraHandle;


      if (!productId) {

        console.error(
          "Wishly: Product ID missing"
        );

        return;
      }


      try {

        await toggleWishlist(
          productId,
          handle
        );


        /*
         * Update UI after operation
         */

        await updateButtons();
        await updateCounter();

      } catch (error) {

        console.error(
          "Wishly: Wishlist operation failed",
          error
        );
      }
    }
  );


  /*
   * ---------------------------------------------------------
   * INITIALIZE
   * ---------------------------------------------------------
   */

  async function init() {

    console.log(
      "Wishly initialized"
    );

    console.log(
      "Wishly logged in:",
      isLoggedIn
    );


    /*
     * Load account wishlist and
     * update hearts/counter.
     */

    await updateButtons();

    await updateCounter();
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


  /*
   * ---------------------------------------------------------
   * PUBLIC WISHLY API
   * ---------------------------------------------------------
   */

  window.Wishly = {

    getWishlist,

    getGuestWishlist,

    getCustomerWishlist,

    addToWishlist,

    removeFromWishlist,

    toggleWishlist,

    updateButtons,

    updateCounter,

    isLoggedIn
  };

})();