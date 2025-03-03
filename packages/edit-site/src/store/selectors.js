/**
 * External dependencies
 */
import createSelector from 'rememo';

/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { uploadMedia } from '@wordpress/media-utils';
import { isTemplatePart } from '@wordpress/blocks';
import { Platform } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * @typedef {'template'|'template_type'} TemplateType Template type.
 */

/**
 * Helper for getting a preference from the preferences store.
 *
 * This is only present so that `getSettings` doesn't need to be made a
 * registry selector.
 *
 * It's unstable because the selector needs to be exported and so part of the
 * public API to work.
 */
export const __unstableGetPreference = createRegistrySelector(
	( select ) => ( state, name ) =>
		select( preferencesStore ).get( 'core/edit-site', name )
);

/**
 * Returns whether the given feature is enabled or not.
 *
 * @param {Object} state       Global application state.
 * @param {string} featureName Feature slug.
 *
 * @return {boolean} Is active.
 */
export function isFeatureActive( state, featureName ) {
	deprecated( `select( 'core/interface' ).isFeatureActive`, {
		since: '6.0',
		alternative: `select( 'core/preferences' ).get`,
	} );

	return !! __unstableGetPreference( state, featureName );
}

/**
 * Returns the current editing canvas device type.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Device type.
 */
export function __experimentalGetPreviewDeviceType( state ) {
	return state.deviceType;
}

/**
 * Returns whether the current user can create media or not.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} Whether the current user can create media or not.
 */
export const getCanUserCreateMedia = createRegistrySelector(
	( select ) => () => select( coreDataStore ).canUser( 'create', 'media' )
);

/**
 * Returns any available Reusable blocks.
 *
 * @param {Object} state Global application state.
 *
 * @return {Array} The available reusable blocks.
 */
export const getReusableBlocks = createRegistrySelector( ( select ) => () => {
	const isWeb = Platform.OS === 'web';
	return isWeb
		? select( coreDataStore ).getEntityRecords( 'postType', 'wp_block', {
				per_page: -1,
		  } )
		: [];
} );

/**
 * Returns the settings, taking into account active features and permissions.
 *
 * @param {Object}   state             Global application state.
 * @param {Function} setIsInserterOpen Setter for the open state of the global inserter.
 *
 * @return {Object} Settings.
 */
export const getSettings = createSelector(
	( state, setIsInserterOpen ) => {
		const settings = {
			...state.settings,
			outlineMode: true,
			focusMode: !! __unstableGetPreference( state, 'focusMode' ),
			hasFixedToolbar: !! __unstableGetPreference(
				state,
				'fixedToolbar'
			),
			keepCaretInsideBlock: !! __unstableGetPreference(
				state,
				'keepCaretInsideBlock'
			),
			showIconLabels: !! __unstableGetPreference(
				state,
				'showIconLabels'
			),
			__experimentalSetIsInserterOpened: setIsInserterOpen,
			__experimentalReusableBlocks: getReusableBlocks( state ),
			__experimentalPreferPatternsOnRoot:
				'wp_template' === getEditedPostType( state ),
		};

		const canUserCreateMedia = getCanUserCreateMedia( state );
		if ( ! canUserCreateMedia ) {
			return settings;
		}

		settings.mediaUpload = ( { onError, ...rest } ) => {
			uploadMedia( {
				wpAllowedMimeTypes: state.settings.allowedMimeTypes,
				onError: ( { message } ) => onError( message ),
				...rest,
			} );
		};
		return settings;
	},
	( state ) => [
		getCanUserCreateMedia( state ),
		state.settings,
		__unstableGetPreference( state, 'focusMode' ),
		__unstableGetPreference( state, 'fixedToolbar' ),
		__unstableGetPreference( state, 'keepCaretInsideBlock' ),
		__unstableGetPreference( state, 'showIconLabels' ),
		getReusableBlocks( state ),
		getEditedPostType( state ),
	]
);

/**
 * @deprecated
 */
export function getHomeTemplateId() {
	deprecated( "select( 'core/edit-site' ).getHomeTemplateId", {
		since: '6.2',
		version: '6.4',
	} );
}

/**
 * Returns the current edited post type (wp_template or wp_template_part).
 *
 * @param {Object} state Global application state.
 *
 * @return {TemplateType?} Template type.
 */
export function getEditedPostType( state ) {
	return state.editedPost.postType;
}

/**
 * Returns the ID of the currently edited template or template part.
 *
 * @param {Object} state Global application state.
 *
 * @return {string?} Post ID.
 */
export function getEditedPostId( state ) {
	return state.editedPost.id;
}

/**
 * Returns the edited post's context object.
 *
 * @deprecated
 * @param {Object} state Global application state.
 *
 * @return {Object} Page.
 */
export function getEditedPostContext( state ) {
	return state.editedPost.context;
}

/**
 * Returns the current page object.
 *
 * @deprecated
 * @param {Object} state Global application state.
 *
 * @return {Object} Page.
 */
export function getPage( state ) {
	return { context: state.editedPost.context };
}

/**
 * Returns the current opened/closed state of the inserter panel.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} True if the inserter panel should be open; false if closed.
 */
export function isInserterOpened( state ) {
	return !! state.blockInserterPanel;
}

/**
 * Get the insertion point for the inserter.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} The root client ID, index to insert at and starting filter value.
 */
export function __experimentalGetInsertionPoint( state ) {
	const { rootClientId, insertionIndex, filterValue } =
		state.blockInserterPanel;
	return { rootClientId, insertionIndex, filterValue };
}

/**
 * Returns the current opened/closed state of the list view panel.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} True if the list view panel should be open; false if closed.
 */
export function isListViewOpened( state ) {
	return state.listViewPanel;
}

/**
 * Returns the current opened/closed state of the save panel.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} True if the save panel should be open; false if closed.
 */
export function isSaveViewOpened( state ) {
	return state.saveViewPanel;
}

/**
 * Returns the template parts and their blocks for the current edited template.
 *
 * @param {Object} state Global application state.
 * @return {Array} Template parts and their blocks in an array.
 */
export const getCurrentTemplateTemplateParts = createRegistrySelector(
	( select ) => ( state ) => {
		const templateType = getEditedPostType( state );
		const templateId = getEditedPostId( state );
		const template = select( coreDataStore ).getEditedEntityRecord(
			'postType',
			templateType,
			templateId
		);

		const templateParts = select( coreDataStore ).getEntityRecords(
			'postType',
			'wp_template_part',
			{ per_page: -1 }
		);
		const templatePartsById = templateParts
			? // Key template parts by their ID.
			  templateParts.reduce(
					( newTemplateParts, part ) => ( {
						...newTemplateParts,
						[ part.id ]: part,
					} ),
					{}
			  )
			: {};

		return ( template.blocks ?? [] )
			.filter( ( block ) => isTemplatePart( block ) )
			.map( ( block ) => {
				const {
					attributes: { theme, slug },
				} = block;
				const templatePartId = `${ theme }//${ slug }`;
				const templatePart = templatePartsById[ templatePartId ];

				return {
					templatePart,
					block,
				};
			} )
			.filter( ( { templatePart } ) => !! templatePart );
	}
);

/**
 * Returns the current editing mode.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Editing mode.
 */
export function getEditorMode( state ) {
	return __unstableGetPreference( state, 'editorMode' );
}

/**
 * Returns the current canvas mode.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Canvas mode.
 */
export function __unstableGetCanvasMode( state ) {
	return state.canvasMode;
}

/**
 * @deprecated
 */
export function getCurrentTemplateNavigationPanelSubMenu() {
	deprecated(
		"dispatch( 'core/edit-site' ).getCurrentTemplateNavigationPanelSubMenu",
		{
			since: '6.2',
			version: '6.4',
		}
	);
}

/**
 * @deprecated
 */
export function getNavigationPanelActiveMenu() {
	deprecated( "dispatch( 'core/edit-site' ).getNavigationPanelActiveMenu", {
		since: '6.2',
		version: '6.4',
	} );
}

/**
 * @deprecated
 */
export function isNavigationOpened() {
	deprecated( "dispatch( 'core/edit-site' ).isNavigationOpened", {
		since: '6.2',
		version: '6.4',
	} );
}
