from dataclasses import dataclass

from apps.execution.models import ExecutionRecordState


class InvalidExecutionTransition(ValueError):
    """Raised when an execution workflow transition is not allowed."""


ALLOWED_TRANSITIONS = {
    ExecutionRecordState.DRAFT: {
        ExecutionRecordState.SUBMITTED,
    },
    ExecutionRecordState.SUBMITTED: {
        ExecutionRecordState.UNDER_REVIEW,
    },
    ExecutionRecordState.UNDER_REVIEW: {
        ExecutionRecordState.APPROVED,
        ExecutionRecordState.RETURNED_FOR_CORRECTION,
        ExecutionRecordState.REJECTED,
    },
    ExecutionRecordState.RETURNED_FOR_CORRECTION: {
        ExecutionRecordState.SUBMITTED,
    },
    ExecutionRecordState.APPROVED: {
        ExecutionRecordState.CERTIFIED,
    },
    ExecutionRecordState.REJECTED: set(),
    ExecutionRecordState.CERTIFIED: {
        ExecutionRecordState.LOCKED,
    },
    ExecutionRecordState.LOCKED: set(),
}


@dataclass(frozen=True)
class TransitionResult:
    from_state: str
    to_state: str


def ensure_transition_allowed(from_state: str, to_state: str) -> TransitionResult:
    allowed_states = ALLOWED_TRANSITIONS.get(from_state, set())
    if to_state not in allowed_states:
        raise InvalidExecutionTransition(
            f"Cannot transition execution record from {from_state} to {to_state}."
        )
    return TransitionResult(from_state=from_state, to_state=to_state)
