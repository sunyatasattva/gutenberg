/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { forwardRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import Inserter from '../inserter';

export const Appender = forwardRef(
	( { nestingLevel, blockCount, ...props }, ref ) => {
		const instanceId = useInstanceId( Appender );
		const { hideInserter, clientId } = useSelect( ( select ) => {
			const {
				getTemplateLock,
				__unstableGetEditorMode,
				getSelectedBlockClientId,
			} = select( blockEditorStore );

			const _clientId = getSelectedBlockClientId();

			return {
				clientId: getSelectedBlockClientId(),
				hideInserter:
					!! getTemplateLock( _clientId ) ||
					__unstableGetEditorMode() === 'zoom-out',
			};
		}, [] );

		const blockTitle = useBlockDisplayTitle( {
			clientId,
			context: 'list-view',
		} );

		if ( hideInserter ) {
			return null;
		}

		const descriptionId = `off-canvas-editor-appender__${ instanceId }`;
		const description = sprintf(
			/* translators: 1: The name of the block. 2: The numerical position of the block. 3: The level of nesting for the block. */
			__( 'Append to %1$s block at position %2$d, Level %3$d' ),
			blockTitle,
			blockCount + 1,
			nestingLevel
		);

		return (
			<div className="offcanvas-editor-appender">
				<Inserter
					ref={ ref }
					rootClientId={ clientId }
					position="bottom right"
					isAppender={ true }
					selectBlockOnInsert={ false }
					shouldDirectInsert={ false }
					__experimentalIsQuick
					{ ...props }
					toggleProps={ { 'aria-describedby': descriptionId } }
				/>
				<div
					className="offcanvas-editor-appender__description"
					id={ descriptionId }
				>
					{ description }
				</div>
			</div>
		);
	}
);
