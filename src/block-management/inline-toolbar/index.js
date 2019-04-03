/** @flow
 * @format */

/**
 * External dependencies
 */
import React from 'react';
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import InlineToolbarActions from './actions';

export { InlineToolbarActions };

type PropsType = {
	clientId: string,
	canMoveUp: boolean,
	canMoveDown: boolean,
	onButtonPressed: ( button: number ) => void,
	testID: string,
};

export default class InlineToolbar extends React.Component<PropsType> {
	constructor() {
		super( ...arguments );
		// Flow gets picky about reassigning methods on classes
		// https://github.com/facebook/flow/issues/1517#issuecomment-194538151
		( this: any ).onUpPressed = this.onUpPressed.bind( this );
		( this: any ).onDownPressed = this.onDownPressed.bind( this );
		( this: any ).onDeletePressed = this.onDeletePressed.bind( this );
	}

	onUpPressed() {
		this.props.onButtonPressed( InlineToolbarActions.UP );
	}

	onDownPressed() {
		this.props.onButtonPressed( InlineToolbarActions.DOWN );
	}

	onDeletePressed() {
		this.props.onButtonPressed( InlineToolbarActions.DELETE );
	}

	render() {
		const { testID } = this.props;
		return (
			<View style={ styles.toolbar } >
				<ToolbarButton
					title={ __( `Move ${ testID } up` ) }
					isDisabled={ ! this.props.canMoveUp }
					onClick={ this.onUpPressed }
					icon="arrow-up-alt"
				/>

				<ToolbarButton
					title={ __( `Move ${ testID } down` ) }
					isDisabled={ ! this.props.canMoveDown }
					onClick={ this.onDownPressed }
					icon="arrow-down-alt"
				/>

				<View style={ styles.spacer } />

				<InspectorControls.Slot />

				<ToolbarButton
					title={ __( `Remove ${ testID }` ) }
					onClick={ this.onDeletePressed }
					icon="trash"
				/>
			</View>
		);
	}
}
