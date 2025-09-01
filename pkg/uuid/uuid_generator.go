package uuid

// UuidGenerator is common uuid generator interface
type UuidGenerator interface {
	GenerateUuid(uuidType UuidType) int64
	GenerateUuids(uuidType UuidType, count uint16) []int64
}
