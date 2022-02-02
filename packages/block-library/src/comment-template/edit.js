/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	BlockContextProvider,
	BlockPreview,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { convertToTree } from './util';

const TEMPLATE = [
	[ 'core/comment-author-avatar' ],
	[ 'core/comment-author-name' ],
	[ 'core/comment-date' ],
	[ 'core/comment-content' ],
	[ 'core/comment-reply-link' ],
	[ 'core/comment-edit-link' ],
];

/**
 * External dependencies
 */
import { uniqueId } from 'lodash';

/**
 * Component which renders the inner blocks of the Comment Template.
 *
 * @param {Object} props                    Component props.
 * @param {Array}  [props.comment]          - A comment object.
 * @param {Array}  [props.activeComment]    - The block that is currently active.
 * @param {Array}  [props.setActiveComment] - The setter for activeComment.
 * @param {Array}  [props.firstBlock]       - First comment in the array.
 * @param {Array}  [props.blocks]           - Array of blocks returned from
 *                                          getBlocks() in parent .
 * @return {WPElement}                 		Inner blocks of the Comment Template
 */
function CommentTemplateInnerBlocks( {
	comment,
	activeComment,
	setActiveComment,
	firstBlock,
	blocks,
} ) {
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		{},
		{ template: TEMPLATE }
	);
	return (
		<li { ...innerBlocksProps }>
			{ comment === ( activeComment || firstBlock ) ? (
				children
			) : (
				<BlockPreview
					blocks={ blocks }
					__experimentalLive
					__experimentalOnClick={ () => setActiveComment( comment ) }
				/>
			) }
			{ comment?.children?.length > 0 ? (
				<CommentsList
					comments={ comment.children }
					activeComment={ activeComment }
					setActiveComment={ setActiveComment }
					blocks={ blocks }
				/>
			) : null }
		</li>
	);
}

/**
 * Component that renders a list of (nested) comments. It is called recursively.
 *
 * @param {Object} props                    Component props.
 * @param {Array}  [props.comments]         - Array of comment objects.
 * @param {Array}  [props.blockProps]       - Props from parent's `useBlockProps()`.
 * @param {Array}  [props.activeComment]    - The block that is currently active.
 * @param {Array}  [props.setActiveComment] - The setter for activeComment.
 * @param {Array}  [props.blocks]           - Array of blocks returned from
 *                                          getBlocks() in parent .
 * @return {WPElement}                 		List of comments.
 */
const CommentsList = ( {
	comments,
	blockProps,
	activeComment,
	setActiveComment,
	blocks,
} ) => (
	<ol { ...blockProps }>
		{ comments &&
			comments.map( ( comment ) => (
				<BlockContextProvider
					key={ comment.commentId || uniqueId( 'comment-default' ) }
					value={ comment }
				>
					<CommentTemplateInnerBlocks
						comment={ comment }
						activeComment={ activeComment }
						setActiveComment={ setActiveComment }
						blocks={ blocks }
						firstBlock={ comments[ 0 ] }
					/>
				</BlockContextProvider>
			) ) }
	</ol>
);

export default function CommentTemplateEdit( {
	clientId,
	context: { postId, 'comments/perPage': perPage, 'comments/order': order },
} ) {
	const blockProps = useBlockProps();

	const [ activeComment, setActiveComment ] = useState();
	const {
		commentOrder,
		commentsPerPage,
		threadCommentsDepth,
		threadComments,
	} = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings().__experimentalDiscussionSettings;
	} );

	const { rawComments, blocks } = useSelect(
		( select ) => {
			const { getEntityRecords } = select( coreStore );
			const { getBlocks } = select( blockEditorStore );

			const commentQuery = {
				post: postId,
				status: 'approve',
				context: 'embed',
				order: order || commentOrder,
			};

			if ( order ) {
				commentQuery.order = order;
			}
			return {
				rawComments: getEntityRecords(
					'root',
					'comment',
					commentQuery
				),
				blocks: getBlocks( clientId ),
			};
		},
		[ postId, clientId, order ]
	);

	// TODO: Replicate the logic used on the server.
	perPage = perPage || commentsPerPage;
	// We convert the flat list of comments to tree.
	// Then, we show only a maximum of `perPage` number of comments.
	// This is because passing `per_page` to `getEntityRecords()` does not
	// take into account nested comments.
	let comments = useMemo(
		() => convertToTree( rawComments ).slice( 0, perPage ),
		[ rawComments, perPage ]
	);

	// In case that `threadCommentsDepth` is falsy, we default to a somewhat
	// arbitrary value of 3.
	// In case that the value is set but larger than 3 we truncate it to 3.
	const commentsDepth = Math.min( threadCommentsDepth || 3, 3 );

	// We set a limit in order not to overload the editor of empty comments.
	const defaultCommentsToShow =
		perPage <= commentsDepth ? perPage : commentsDepth;

	if ( ! postId ) {
		if ( ! threadComments || defaultCommentsToShow === 1 ) {
			// If displaying threaded comments is disabled, we only show one comment
			comments = [ { commentId: null, children: [] } ];
		} else if ( defaultCommentsToShow === 2 ) {
			comments = [
				{
					commentId: null,
					children: [ { commentId: null, children: [] } ],
				},
			];
		} else if ( defaultCommentsToShow === 3 ) {
			comments = [
				{
					commentId: null,
					children: [
						{
							commentId: null,
							children: [ { commentId: null, children: [] } ],
						},
					],
				},
			];
		}
	}

	if ( ! rawComments ) {
		return (
			<p { ...blockProps }>
				<Spinner />
			</p>
		);
	}

	if ( ! comments.length ) {
		return <p { ...blockProps }> { __( 'No results found.' ) }</p>;
	}

	return (
		<CommentsList
			comments={ comments }
			blockProps={ blockProps }
			blocks={ blocks }
			activeComment={ activeComment }
			setActiveComment={ setActiveComment }
		/>
	);
}
