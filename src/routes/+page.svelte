<script lang="ts">
	import { goto } from "$app/navigation";
	import { base } from "$app/paths";
	import { page } from "$app/stores";
	import { PUBLIC_APP_NAME } from "$env/static/public";
	import ChatWindow from "$lib/components/chat/ChatWindow.svelte";
	import Logo from "$lib/components/icons/Logo.svelte";
	import { ERROR_MESSAGES, error } from "$lib/stores/errors";
	import { pendingMessage } from "$lib/stores/pendingMessage";
	import { useSettingsStore } from "$lib/stores/settings.js";
	import { findCurrentModel } from "$lib/utils/models";

	export let data;
	let loading = false;
	let files: File[] = [];

	const settings = useSettingsStore();

	async function createConversation(message: string) {
		try {
			loading = true;

			// check if $settings.activeModel is a valid model
			// else check if it's an assistant, and use that model
			// else use the first model

			const validModels = data.models.map((model) => model.id);

			let model;
			if (validModels.includes($settings.activeModel)) {
				model = $settings.activeModel;
			} else {
				if (validModels.includes(data.assistant?.modelId)) {
					model = data.assistant?.modelId;
				} else {
					model = data.models[0].id;
				}
			}
			const res = await fetch(`${base}/conversation`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model,
					preprompt: $settings.customPrompts[$settings.activeModel],
					assistantId: data.assistant?._id,
				}),
			});

			if (!res.ok) {
				const errorMessage = (await res.json()).message || ERROR_MESSAGES.default;
				error.set(errorMessage);
				console.error("Error while creating conversation: ", errorMessage);
				return;
			}

			const { conversationId } = await res.json();

			// Ugly hack to use a store as temp storage, feel free to improve ^^
			pendingMessage.set({
				content: message,
				files,
			});

			// invalidateAll to update list of conversations
			await goto(`${base}/conversation/${conversationId}`, { invalidateAll: true });
		} catch (err) {
			error.set((err as Error).message || ERROR_MESSAGES.default);
			console.error(err);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{PUBLIC_APP_NAME}</title>
</svelte:head>

{#if $page.data.loginRequired}
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
	<ChatWindow
		on:message={(ev) => createConversation(ev.detail)}
		{loading}
		assistant={data.assistant}
		currentModel={findCurrentModel([...data.models, ...data.oldModels], $settings.activeModel)}
		models={data.models}
		bind:files
	/>
{/if}
