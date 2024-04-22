<script lang="ts">
	import "../styles/main.css";

	import { onDestroy } from "svelte";
	import { goto, invalidate } from "$app/navigation";
	import { base } from "$app/paths";
	import { page } from "$app/stores";
	import { browser } from "$app/environment";

	import {
		PUBLIC_APP_DESCRIPTION,
		PUBLIC_ORIGIN,
		PUBLIC_PLAUSIBLE_SCRIPT_URL,
	} from "$env/static/public";
	import { PUBLIC_APP_ASSETS, PUBLIC_APP_NAME } from "$env/static/public";

	import { error } from "$lib/stores/errors";
	import { createSettingsStore } from "$lib/stores/settings";

	import { shareConversation } from "$lib/shareConversation";
	import { UrlDependency } from "$lib/types/UrlDependency";

	import Toast from "$lib/components/Toast.svelte";
	import NavMenu from "$lib/components/NavMenu.svelte";
	import MobileNav from "$lib/components/MobileNav.svelte";
	import titleUpdate from "$lib/stores/titleUpdate";
	import DisclaimerModal from "$lib/components/DisclaimerModal.svelte";
	import ExpandNavigation from "$lib/components/ExpandNavigation.svelte";
	import Logo from "$lib/components/icons/Logo.svelte";

	export let data;

	let isNavOpen = false;
	let isNavCollapsed = false;

	let errorToastTimeout: ReturnType<typeof setTimeout>;
	let currentError: string | null;

	async function onError() {
		// If a new different error comes, wait for the current error to hide first
		if ($error && currentError && $error !== currentError) {
			clearTimeout(errorToastTimeout);
			currentError = null;
			await new Promise((resolve) => setTimeout(resolve, 300));
		}

		currentError = $error;

		errorToastTimeout = setTimeout(() => {
			$error = null;
			currentError = null;
		}, 3000);
	}

	async function deleteConversation(id: string) {
		try {
			const res = await fetch(`${base}/conversation/${id}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!res.ok) {
				$error = "Error while deleting conversation, try again.";
				return;
			}

			if ($page.params.id !== id) {
				await invalidate(UrlDependency.ConversationList);
			} else {
				await goto(`${base}/`, { invalidateAll: true });
			}
		} catch (err) {
			console.error(err);
			$error = String(err);
		}
	}

	async function editConversationTitle(id: string, title: string) {
		try {
			const res = await fetch(`${base}/conversation/${id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ title }),
			});

			if (!res.ok) {
				$error = "Error while editing title, try again.";
				return;
			}

			await invalidate(UrlDependency.ConversationList);
		} catch (err) {
			console.error(err);
			$error = String(err);
		}
	}

	onDestroy(() => {
		clearTimeout(errorToastTimeout);
	});

	$: if ($error) onError();

	$: if ($titleUpdate) {
		const convIdx = data.conversations.findIndex(({ id }) => id === $titleUpdate?.convId);

		if (convIdx != -1) {
			data.conversations[convIdx].title = $titleUpdate?.title ?? data.conversations[convIdx].title;
		}
		// update data.conversations
		data.conversations = [...data.conversations];

		$titleUpdate = null;
	}

	const settings = createSettingsStore(data.settings);

	$: if (browser && $page.url.searchParams.has("model")) {
		if ($settings.activeModel === $page.url.searchParams.get("model")) {
			goto(`${base}/?`);
		}
		settings.instantSet({
			activeModel: $page.url.searchParams.get("model") ?? $settings.activeModel,
		});
	}

	$: mobileNavTitle = ["/models", "/assistants", "/privacy"].includes($page.route.id ?? "")
		? ""
		: data.conversations.find((conv) => conv.id === $page.params.id)?.title;
</script>

<svelte:head>
	<title>{PUBLIC_APP_NAME}</title>
	<meta name="description" content="The first open source alternative to ChatGPT. 💪" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@huggingface" />

	<!-- use those meta tags everywhere except on the share assistant page -->
	<!-- feel free to refacto if there's a better way -->
	{#if !$page.url.pathname.includes("/assistant/") && $page.route.id !== "/assistants" && !$page.url.pathname.includes("/models/")}
		<meta property="og:title" content={PUBLIC_APP_NAME} />
		<meta property="og:type" content="website" />
		<meta property="og:url" content="{PUBLIC_ORIGIN || $page.url.origin}{base}" />
		<meta
			property="og:image"
			content="{PUBLIC_ORIGIN || $page.url.origin}{base}/{PUBLIC_APP_ASSETS}/thumbnail.png"
		/>
		<meta property="og:description" content={PUBLIC_APP_DESCRIPTION} />
	{/if}
	<link
		rel="icon"
		href="{PUBLIC_ORIGIN || $page.url.origin}{base}/{PUBLIC_APP_ASSETS}/favicon.ico"
		sizes="32x32"
	/>
	<link
		rel="icon"
		href="{PUBLIC_ORIGIN || $page.url.origin}{base}/{PUBLIC_APP_ASSETS}/icon.svg"
		type="image/svg+xml"
	/>
	<link
		rel="apple-touch-icon"
		href="{PUBLIC_ORIGIN || $page.url.origin}{base}/{PUBLIC_APP_ASSETS}/apple-touch-icon.png"
	/>
	<link
		rel="manifest"
		href="{PUBLIC_ORIGIN || $page.url.origin}{base}/{PUBLIC_APP_ASSETS}/manifest.json"
	/>

	{#if PUBLIC_PLAUSIBLE_SCRIPT_URL && PUBLIC_ORIGIN}
		<script
			defer
			data-domain={new URL(PUBLIC_ORIGIN).hostname}
			src={PUBLIC_PLAUSIBLE_SCRIPT_URL}
		></script>
	{/if}
</svelte:head>

<!-- {#if !$settings.ethicsModalAccepted && $page.url.pathname !== `${base}/privacy`}
	<DisclaimerModal />
{/if} -->

{#if $page.data.loginEnabled && $page.data.loginRequired}
	<div class="bg-white">
		<header class="absolute inset-x-0 top-0 z-50">
			<nav class="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
				<div class="flex lg:flex-1">
					<a href="#" class="-m-1.5 p-1.5">
						<span class="sr-only">PreGPT</span>
						<Logo classNames="h-8 w-auto" />

						<!-- <img class="h-8 w-auto" src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600" alt=""> -->
					</a>
				</div>

				<!-- <div class="hidden lg:flex lg:gap-x-12">
	  <a href="#" class="text-sm font-semibold leading-6 text-gray-900">Product</a>
	  <a href="#" class="text-sm font-semibold leading-6 text-gray-900">Features</a>
	  <a href="#" class="text-sm font-semibold leading-6 text-gray-900">Marketplace</a>
	  <a href="#" class="text-sm font-semibold leading-6 text-gray-900">Company</a>
	</div>
	<div class="hidden lg:flex lg:flex-1 lg:justify-end">
	  <a href="#" class="text-sm font-semibold leading-6 text-gray-900">Log in <span aria-hidden="true">&rarr;</span></a>
	</div> -->
			</nav>
		</header>

		<div class="relative isolate px-6 pt-14 lg:px-8">
			<!-- <div class="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
	<div class="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"></div>
  </div> -->
			<!-- class="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56" -->
			<div class="bg-white py-12 sm:py-24">
				<div class="text-center">
					<h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">PreGPT</h1>
					<p class="mt-6 text-lg leading-8 text-gray-600">
						Elevate your Game. Your gateway to unbiased GPT to unleash your full potential.
					</p>
					<div class="mx-auto max-w-xs px-8">
						<form action="{base}/login" target="_parent" method="POST" class="w-full">
							<button
								type="submit"
								class="mt-10 block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 hover:bg-indigo-500"
								>Sign in</button
							>
						</form>
					</div>
					<div class="bg-white py-5 sm:py-10">
						<div class="mx-auto max-w-7xl px-6 lg:px-8">
							<!-- <div class="mx-auto max-w-2xl sm:text-center">
						<h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
							Simple no-tricks pricing
						</h2>
						<p class="mt-6 text-lg leading-8 text-gray-600">
							Distinctio et nulla eum soluta et neque labore quibusdam. Saepe et quasi iusto modi
							velit ut non voluptas in. Explicabo id ut laborum.
						</p>
					</div> -->
							<div
								class="mx-auto mt-16 max-w-2xl rounded-3xl ring-1 ring-gray-200 sm:mt-20 lg:mx-0 lg:flex lg:max-w-none"
							>
								<div class="p-8 sm:p-10 lg:flex-auto">
									<h3 class="text-2xl font-bold tracking-tight text-gray-900">Subscribe</h3>
									<p class="mt-6 text-base leading-7 text-gray-600">
										Lorem ipsum dolor sit amet consect etur adipisicing elit. Itaque amet indis
										perferendis blanditiis repellendus etur quidem assumenda.
									</p>
									<div class="mt-10 flex items-center gap-x-4">
										<h4 class="flex-none text-sm font-semibold leading-6 text-indigo-600">
											What’s included
										</h4>
										<div class="h-px flex-auto bg-gray-100" />
									</div>
									<ul
										role="list"
										class="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-6"
									>
										<li class="flex gap-x-3">
											<svg
												class="h-6 w-5 flex-none text-indigo-600"
												viewBox="0 0 20 20"
												fill="currentColor"
												aria-hidden="true"
											>
												<path
													fill-rule="evenodd"
													d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
													clip-rule="evenodd"
												/>
											</svg>
											Access to unbiased XYZ model
										</li>
										<li class="flex gap-x-3">
											<svg
												class="h-6 w-5 flex-none text-indigo-600"
												viewBox="0 0 20 20"
												fill="currentColor"
												aria-hidden="true"
											>
												<path
													fill-rule="evenodd"
													d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
													clip-rule="evenodd"
												/>
											</svg>
											Control over your history
										</li>
										<li class="flex gap-x-3">
											<svg
												class="h-6 w-5 flex-none text-indigo-600"
												viewBox="0 0 20 20"
												fill="currentColor"
												aria-hidden="true"
											>
												<path
													fill-rule="evenodd"
													d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
													clip-rule="evenodd"
												/>
											</svg>
											Web search
										</li>
										<li class="flex gap-x-3">
											<svg
												class="h-6 w-5 flex-none text-indigo-600"
												viewBox="0 0 20 20"
												fill="currentColor"
												aria-hidden="true"
											>
												<path
													fill-rule="evenodd"
													d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
													clip-rule="evenodd"
												/>
											</svg>
											Complete privacy
										</li>
									</ul>
								</div>
								<div class="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
									<div
										class="rounded-2xl bg-gray-50 py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16"
									>
										<div class="mx-auto max-w-xs px-8">
											<p class="text-base font-semibold text-gray-600">Low monthly fee</p>
											<p class="mt-6 flex items-baseline justify-center gap-x-2">
												<span class="text-5xl font-bold tracking-tight text-gray-900">$4</span>
												<span class="text-sm font-semibold leading-6 tracking-wide text-gray-600"
													>USD</span
												>
											</p>
											<a
												href="#"
												class="mt-10 block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 hover:bg-indigo-500"
												>Get access</a
											>
											<p class="mt-6 text-xs leading-5 text-gray-600">Cancel any time</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- <div class="mt-10 flex items-center justify-center gap-x-6">
		<a href="#" class="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Get started</a>
		<a href="#" class="text-sm font-semibold leading-6 text-gray-900">Learn more <span aria-hidden="true">→</span></a>
	  </div> -->
				</div>
			</div>
			<!-- <div class="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
	<div class="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"></div>
  </div> -->
		</div>
	</div>
{:else}
	<ExpandNavigation
		isCollapsed={isNavCollapsed}
		on:click={() => (isNavCollapsed = !isNavCollapsed)}
		classNames="absolute inset-y-0 z-10 my-auto {!isNavCollapsed
			? 'left-[280px]'
			: 'left-0'} *:transition-transform"
	/>

	<div
		class="grid h-full w-screen grid-cols-1 grid-rows-[auto,1fr] overflow-hidden text-smd {!isNavCollapsed
			? 'md:grid-cols-[280px,1fr]'
			: 'md:grid-cols-[0px,1fr]'} transition-[300ms] [transition-property:grid-template-columns] md:grid-rows-[1fr] dark:text-gray-300"
	>
		<MobileNav
			isOpen={isNavOpen}
			on:toggle={(ev) => (isNavOpen = ev.detail)}
			title={mobileNavTitle}
		>
			<NavMenu
				conversations={data.conversations}
				user={data.user}
				canLogin={data.user === undefined && data.loginEnabled}
				on:shareConversation={(ev) => shareConversation(ev.detail.id, ev.detail.title)}
				on:deleteConversation={(ev) => deleteConversation(ev.detail)}
				on:editConversationTitle={(ev) => editConversationTitle(ev.detail.id, ev.detail.title)}
			/>
		</MobileNav>
		<nav
			class=" grid max-h-screen grid-cols-1 grid-rows-[auto,1fr,auto] overflow-hidden *:w-[280px] max-md:hidden"
		>
			<NavMenu
				conversations={data.conversations}
				user={data.user}
				canLogin={data.user === undefined && data.loginEnabled}
				on:shareConversation={(ev) => shareConversation(ev.detail.id, ev.detail.title)}
				on:deleteConversation={(ev) => deleteConversation(ev.detail)}
				on:editConversationTitle={(ev) => editConversationTitle(ev.detail.id, ev.detail.title)}
			/>
		</nav>
		{#if currentError}
			<Toast message={currentError} />
		{/if}
		<slot />
	</div>
{/if}
