import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
	await authenticate.admin(request);
	return null;
};

export const action = async ({ request }) => {
	await authenticate.admin(request);
	return { saved: true };
};

export default function Settings() {
	const fetcher = useFetcher();
	const shopify = useAppBridge();

	const saveSettings = () => {
		fetcher.submit({ saved: "true" }, { method: "POST" });
		shopify.toast.show("Wishlist settings saved");
	};

	return (
		<s-page heading="Settings">
			<s-button slot="primary-action" onClick={saveSettings}>Save settings</s-button>
			<s-section heading="Storefront experience">
				<s-stack direction="block" gap="base">
					<s-checkbox checked label="Show the wishlist heart on product cards" />
					<s-checkbox checked label="Show the wishlist count in the header" />
					<s-checkbox checked label="Allow guest shoppers to save products" />
					<s-paragraph tone="subdued">Changes apply to the Wishly blocks in your active theme.</s-paragraph>
				</s-stack>
			</s-section>
			<s-section heading="Installation">
				<s-stack direction="block" gap="base">
					<s-badge tone="success">App embed connected</s-badge>
					<s-paragraph>Add the Wishlist button, Wishlist header, and Wishlist page blocks from the theme editor.</s-paragraph>
					<s-button href="/admin/themes/current/editor?context=apps" target="_blank" variant="secondary">Open theme editor</s-button>
				</s-stack>
			</s-section>
		</s-page>
	);
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
