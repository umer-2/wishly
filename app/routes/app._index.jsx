import { useEffect } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`#graphql
    query WishlyOverview {
      shop { name primaryDomain { host } }
    }
  `);
  const { data } = await response.json();
  return { shop: data?.shop || { name: "Your store" } };
};

const plans = [
  { name: "Free", price: "$0", detail: "For small stores getting started", features: ["500 saved items", "Guest and customer wishlists", "Wishlist page and heart button"] },
  { name: "Growth", price: "$25", detail: "For growing catalogs", features: ["5,000 saved items", "Everything in Free", "Basic wishlist analytics"] },
  { name: "Scale", price: "$50", detail: "For high-intent shoppers", features: ["25,000 saved items", "Everything in Growth", "Email capture and exports"] },
  { name: "Plus", price: "$100", detail: "For established brands", features: ["Unlimited saved items", "Everything in Scale", "Priority support"] },
];

export default function Index() {
  const { shop } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  useEffect(() => {
    if (fetcher.data?.saved) shopify.toast.show("Settings saved");
  }, [fetcher.data?.saved, shopify]);

  return (
    <s-page heading="Wishly" inlineSize="large">
      <s-button slot="primary-action" onClick={() => fetcher.submit({ saved: "true" }, { method: "POST" })}>
        Save settings
      </s-button>

      <s-section>
        <s-box padding="large" background="subdued" borderRadius="large">
          <s-stack direction="block" gap="base">
            <s-heading>Turn product interest into sales</s-heading>
            <s-paragraph>Wishly gives shoppers a simple way to save products and gives you a clearer view of buying intent.</s-paragraph>
            <s-stack direction="inline" gap="base">
              <s-badge tone="success">{shop.name} connected</s-badge>
              <s-text tone="subdued">Storefront extension ready</s-text>
            </s-stack>
          </s-stack>
        </s-box>
      </s-section>

      <s-section heading="Overview">
        <s-grid gap="base" gridTemplateColumns="repeat(3, 1fr)">
          <s-box padding="base" borderWidth="base" borderRadius="base"><s-stack direction="block" gap="small"><s-text tone="subdued">Plan</s-text><s-heading>Free</s-heading><s-text>Ready to upgrade as you grow</s-text></s-stack></s-box>
          <s-box padding="base" borderWidth="base" borderRadius="base"><s-stack direction="block" gap="small"><s-text tone="subdued">Saved products</s-text><s-heading>0 / 500</s-heading><s-text>Items saved by shoppers</s-text></s-stack></s-box>
          <s-box padding="base" borderWidth="base" borderRadius="base"><s-stack direction="block" gap="small"><s-text tone="subdued">Storefront</s-text><s-heading>Live</s-heading><s-text>Heart button and wishlist page</s-text></s-stack></s-box>
        </s-grid>
      </s-section>

      <s-section heading="Plans that grow with you">
        <s-grid gap="base" gridTemplateColumns="repeat(4, 1fr)">
          {plans.map((plan) => (
            <s-box key={plan.name} padding="base" borderWidth="base" borderRadius="base" background={plan.name === "Growth" ? "subdued" : undefined}>
              <s-stack direction="block" gap="base">
                <s-stack direction="inline" gap="small"><s-heading>{plan.name}</s-heading>{plan.name === "Growth" && <s-badge tone="info">Popular</s-badge>}</s-stack>
                <s-heading>{plan.price}<s-text tone="subdued">{plan.price === "$0" ? " / forever" : " / month"}</s-text></s-heading>
                <s-text tone="subdued">{plan.detail}</s-text>
                <s-unordered-list>{plan.features.map((feature) => <s-list-item key={feature}>{feature}</s-list-item>)}</s-unordered-list>
                <s-button variant={plan.name === "Free" ? "secondary" : "primary"} disabled={plan.name === "Free"}>{plan.name === "Free" ? "Current plan" : "Choose plan"}</s-button>
              </s-stack>
            </s-box>
          ))}
        </s-grid>
      </s-section>

      <s-section slot="aside" heading="Setup checklist">
        <s-stack direction="block" gap="base">
          <s-badge tone="success">1. Extension installed</s-badge>
          <s-badge tone="success">2. Wishlist page added</s-badge>
          <s-badge tone="success">3. Header link added</s-badge>
          <s-paragraph>In your theme editor, add the Wishly blocks to finish your storefront setup.</s-paragraph>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const action = async ({ request }) => {
  await authenticate.admin(request);
  return { saved: true };
};

export const headers = (headersArgs) => boundary.headers(headersArgs);
