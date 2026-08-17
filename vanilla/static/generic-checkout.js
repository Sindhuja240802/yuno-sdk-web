import {
  getCheckoutSession,
  createPayment,
  getPublicApiKey
} from "./api.js"


async function initCheckout() {

  // Get checkout session from merchant backend
  const {
    checkout_session: checkoutSession,
    country: countryCode
  } = await getCheckoutSession()


  // Get public API key
  const publicApiKey = await getPublicApiKey()


  // Initialize Yuno SDK
  const yuno = await SdkPayments.initialize(
    publicApiKey
  )


  // Make the Yuno instance available globally
  window.yunoInstance = yuno


  const loader = document.getElementById("loader")
  const payButton = document.getElementById("button-pay")
  const status = document.getElementById("payment-status")

  let isPaying = false


  // Start Yuno Checkout
  await yuno.startCheckout({

    checkoutSession,

    // Where Yuno mounts the checkout
    elementSelector: "#root",

    countryCode,

    language: "en",

    showLoading: true,

    keepLoader: true,


    // Embedded checkout
    renderMode: {
      type: "element",

      elementSelector: {
        apmForm: "#form-element",
        actionForm: "#action-form-element"
      }
    },


    // Credit Card configuration
    card: {
      type: "extends",
      styles: ""
    },


    // Called when Yuno generates the One-Time Token
    async createPayment(oneTimeToken) {

      loader.style.display = "block"

      isPaying = true

      payButton.disabled = true

      status.textContent = "Processing payment..."


      try {

        await createPayment({
          oneTimeToken,
          checkoutSession
        })


        // Continue the Yuno payment flow
        yuno.continuePayment()

      } catch (error) {

        console.error(
          "Payment creation failed:",
          error
        )

        status.textContent =
          "Unable to create payment."

        payButton.disabled = false

        isPaying = false

        yuno.hideLoader()
      }
    },


    // Payment method selected
    paymentMethodSelected(data) {

      console.log(
        "Payment method selected:",
        data
      )
    },


    // Final payment result
    paymentResult(data) {

      console.log(
        "Payment result:",
        data
      )

      status.textContent =
        `Payment status: ${data}`

      loader.style.display = "none"

      yuno.hideLoader()

      payButton.disabled = false

      isPaying = false
    },


    // SDK error
    error(error) {

      console.error(
        "Yuno checkout error:",
        error
      )

      status.textContent =
        "Payment could not be completed."

      loader.style.display = "none"

      yuno.hideLoader()

      payButton.disabled = false

      isPaying = false
    }

  })


  // Mount checkout
  yuno.mountCheckout()


  // Merchant Pay Now button
  payButton.addEventListener(
    "click",
    () => {

      yuno.startPayment()

    }
  )
}


// Wait until Yuno SDK is ready
window.addEventListener(
  "sdk-payments-ready",
  initCheckout
)
